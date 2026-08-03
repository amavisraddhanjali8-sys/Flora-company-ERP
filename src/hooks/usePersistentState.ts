import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';

export function usePersistentState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
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

  const isMounted = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // 1. Fetch backend server database state on initial load & window focus
  useEffect(() => {
    let active = true;

    const loadFromApi = async () => {
      try {
        const res = await fetch('/api/db', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        if (res.ok) {
          const dbData = await res.json();
          if (active && dbData && dbData[key] !== undefined) {
            const apiVal = dbData[key];
            if (JSON.stringify(apiVal) !== JSON.stringify(stateRef.current)) {
              setState(apiVal);
              try {
                localStorage.setItem(key, JSON.stringify(apiVal));
              } catch (e) {
                /* ignore */
              }
            }
          } else if (active && (!dbData || dbData[key] === undefined)) {
            // Initialize backend DB key with initial/current value
            await fetch('/api/db', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ [key]: stateRef.current })
            });
          }
        }
      } catch (err) {
        // Backend API might be initializing or offline; client will rely on localStorage
      }
    };

    loadFromApi();

    const handleFocus = () => {
      loadFromApi();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);

    return () => {
      active = false;
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
    };
  }, [key]);

  // 2. Persist state to localStorage and backend API server whenever state changes
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      try {
        if (localStorage.getItem(key) === null) {
          localStorage.setItem(key, JSON.stringify(state));
        }
      } catch (err) {
        console.warn(`Failed to set initial localStorage key "${key}":`, err);
      }
      return;
    }

    // Save locally
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (err) {
      console.warn(`Failed to save to localStorage key "${key}":`, err);
    }

    // Save to server backend database API
    const timer = setTimeout(() => {
      fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ [key]: state })
      }).catch((e) => {
        console.warn(`Failed to sync key "${key}" to backend DB:`, e);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [key, state]);

  // 3. Sync across browser tabs via storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const parsed = JSON.parse(e.newValue);
          setState(parsed);
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
