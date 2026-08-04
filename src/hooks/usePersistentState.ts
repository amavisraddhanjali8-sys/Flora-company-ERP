import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';

// Shared module-level state for request deduplication and update batching
let pendingUpdates: Record<string, any> = {};
let batchTimer: ReturnType<typeof setTimeout> | null = null;
let dbFetchPromise: Promise<Record<string, any> | null> | null = null;

async function fetchDbSingleton(): Promise<Record<string, any> | null> {
  if (dbFetchPromise) return dbFetchPromise;

  dbFetchPromise = (async () => {
    try {
      const res = await fetch('/api/db', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('API DB fetch failed, falling back to localStorage:', err);
    }
    return null;
  })();

  try {
    return await dbFetchPromise;
  } finally {
    // Reset singleton after 400ms so subsequent manual syncs/focuses can re-fetch
    setTimeout(() => {
      dbFetchPromise = null;
    }, 400);
  }
}

function flushPendingUpdates() {
  if (Object.keys(pendingUpdates).length === 0) return;

  const payload = { ...pendingUpdates };
  pendingUpdates = {};

  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }

  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/db', blob);
      return;
    }
  } catch (e) {
    /* fallback to fetch */
  }

  fetch('/api/db', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((err) => {
    console.warn('Failed to flush updates to backend DB:', err);
  });
}

function queueApiUpdate(key: string, value: any, timestamp: number) {
  pendingUpdates[key] = value;
  pendingUpdates[`${key}_ts`] = timestamp;

  if (batchTimer) clearTimeout(batchTimer);
  batchTimer = setTimeout(() => {
    flushPendingUpdates();
  }, 100);
}

// Register global window listeners for flushing pending writes on page unload or tab hide
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushPendingUpdates();
  });
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPendingUpdates();
    }
  });
}

export function usePersistentState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  // Synchronously initialize state from localStorage
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.warn(`Failed to parse localStorage key "${key}":`, err);
    }
    return initialValue;
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const isInitialMount = useRef(true);

  // 1. Initial hydration & backend API server reconciliation
  useEffect(() => {
    let active = true;

    const reconcileWithServer = async () => {
      const dbData = await fetchDbSingleton();
      if (!active || !dbData) return;

      const serverVal = dbData[key];
      const serverTs = Number(dbData[`${key}_ts`]) || 0;

      const storedLocal = localStorage.getItem(key);
      const hasLocal = storedLocal !== null;
      const localTs = Number(localStorage.getItem(`${key}_ts`)) || (hasLocal ? 1 : 0);

      if (serverVal !== undefined) {
        // If local storage exists and local timestamp is >= server timestamp, preserve local state
        if (hasLocal && localTs >= serverTs) {
          queueApiUpdate(key, stateRef.current, localTs);
        } else {
          // Server timestamp is newer or local had no saved value; server wins
          if (JSON.stringify(serverVal) !== JSON.stringify(stateRef.current)) {
            setState(serverVal);
            try {
              localStorage.setItem(key, JSON.stringify(serverVal));
              localStorage.setItem(`${key}_ts`, (serverTs || Date.now()).toString());
            } catch (e) {
              /* ignore */
            }
          }
        }
      } else {
        // Server has no value for this key yet; push local state to server
        const ts = localTs || Date.now();
        queueApiUpdate(key, stateRef.current, ts);
        try {
          if (!hasLocal) {
            localStorage.setItem(key, JSON.stringify(stateRef.current));
            localStorage.setItem(`${key}_ts`, ts.toString());
          }
        } catch (e) {
          /* ignore */
        }
      }
    };

    reconcileWithServer();

    const handleFocus = () => {
      reconcileWithServer();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);

    return () => {
      active = false;
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
    };
  }, [key]);

  // 2. Persist state changes synchronously to localStorage and queue server sync
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      try {
        if (localStorage.getItem(key) !== null && !localStorage.getItem(`${key}_ts`)) {
          localStorage.setItem(`${key}_ts`, Date.now().toString());
        }
      } catch (e) {
        /* ignore */
      }
      return;
    }

    const now = Date.now();

    // Save locally
    try {
      localStorage.setItem(key, JSON.stringify(state));
      localStorage.setItem(`${key}_ts`, now.toString());
    } catch (err) {
      console.warn(`Failed to save to localStorage key "${key}":`, err);
    }

    // Queue update to server DB
    queueApiUpdate(key, state, now);
  }, [key, state]);

  // 3. Cross-tab synchronization via storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (JSON.stringify(parsed) !== JSON.stringify(stateRef.current)) {
            setState(parsed);
          }
        } catch (err) {
          console.warn(`Failed to sync storage change for "${key}":`, err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [state, setState];
}
