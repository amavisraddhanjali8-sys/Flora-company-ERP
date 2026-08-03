import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';

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

  // Save to localStorage when state updates
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      // Also ensure key exists in localStorage
      try {
        if (localStorage.getItem(key) === null) {
          localStorage.setItem(key, JSON.stringify(state));
        }
      } catch (err) {
        console.warn(`Failed to set initial localStorage key "${key}":`, err);
      }
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (err) {
      console.warn(`Failed to save to localStorage key "${key}":`, err);
    }
  }, [key, state]);

  // Sync across browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setState(JSON.parse(e.newValue));
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
