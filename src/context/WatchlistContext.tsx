'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

export const WATCHLIST_STORAGE_KEY = 'animeyt_watchlist_v1';
const LEGACY_STORAGE_KEY = 'animeyt_watchlist';

export interface WatchlistContextType {
  watchlist: string[];
  count: number;
  isInitialized: boolean;
  addToWatchlist: (id: string, slug?: string) => void;
  removeFromWatchlist: (id: string, slug?: string) => void;
  toggleWatchlist: (id: string, slug?: string) => boolean;
  isInWatchlist: (id?: string | null, slug?: string | null) => boolean;
  clearWatchlist: () => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

function getBrowserStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      }
    }

    // Attempt legacy migration if v1 key is absent
    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw);
      if (Array.isArray(legacyParsed)) {
        const migrated = legacyParsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
        try {
          window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(migrated));
          window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch {
          // ignore storage quota / permission error
        }
        return migrated;
      }
    }
  } catch (err) {
    console.warn('[Watchlist] Could not read from localStorage:', err);
  }
  return [];
}

function setBrowserStorage(items: string[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
    // Dispatch custom event for immediate same-tab reactive synchronization
    window.dispatchEvent(new CustomEvent('animeyt_watchlist_change', { detail: items }));
    return true;
  } catch (err) {
    console.warn('[Watchlist] Could not write to localStorage:', err);
    return false;
  }
}

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount (prevents SSR hydration mismatch)
  useEffect(() => {
    const initial = getBrowserStorage();
    setWatchlist(initial);
    setIsInitialized(true);

    // Cross-tab synchronization via standard 'storage' event
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === WATCHLIST_STORAGE_KEY) {
        try {
          const updated = e.newValue ? JSON.parse(e.newValue) : [];
          if (Array.isArray(updated)) {
            setWatchlist(updated.filter((item): item is string => typeof item === 'string' && item.trim().length > 0));
          } else {
            setWatchlist([]);
          }
        } catch {
          setWatchlist([]);
        }
      }
    };

    // Same-tab custom event synchronization
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>;
      if (Array.isArray(customEvent.detail)) {
        setWatchlist(customEvent.detail);
      } else {
        setWatchlist(getBrowserStorage());
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('animeyt_watchlist_change', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('animeyt_watchlist_change', handleCustomEvent);
    };
  }, []);

  const isInWatchlist = useCallback(
    (id?: string | null, slug?: string | null): boolean => {
      if (!isInitialized) return false;
      if (id && watchlist.includes(id)) return true;
      if (slug && watchlist.includes(slug)) return true;
      return false;
    },
    [isInitialized, watchlist]
  );

  const addToWatchlist = useCallback(
    (id: string, slug?: string) => {
      const targetId = id.trim();
      if (!targetId) return;

      setWatchlist((prev) => {
        // Prevent duplicates (checking both id and slug)
        if (prev.includes(targetId) || (slug && prev.includes(slug.trim()))) {
          return prev;
        }
        const next = [targetId, ...prev];
        setBrowserStorage(next);
        return next;
      });
    },
    []
  );

  const removeFromWatchlist = useCallback(
    (id: string, slug?: string) => {
      const targetId = id?.trim();
      const targetSlug = slug?.trim();

      setWatchlist((prev) => {
        const next = prev.filter((item) => item !== targetId && (!targetSlug || item !== targetSlug));
        setBrowserStorage(next);
        return next;
      });
    },
    []
  );

  const toggleWatchlist = useCallback(
    (id: string, slug?: string): boolean => {
      const targetId = id.trim();
      const targetSlug = slug?.trim();
      if (!targetId) return false;

      const currentlySaved = watchlist.includes(targetId) || (Boolean(targetSlug) && watchlist.includes(targetSlug!));

      if (currentlySaved) {
        removeFromWatchlist(targetId, targetSlug);
        return false;
      } else {
        addToWatchlist(targetId, targetSlug);
        return true;
      }
    },
    [watchlist, addToWatchlist, removeFromWatchlist]
  );

  const clearWatchlist = useCallback(() => {
    setWatchlist([]);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(WATCHLIST_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('animeyt_watchlist_change', { detail: [] }));
      } catch (err) {
        console.warn('[Watchlist] Could not clear localStorage:', err);
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      watchlist,
      count: isInitialized ? watchlist.length : 0,
      isInitialized,
      addToWatchlist,
      removeFromWatchlist,
      toggleWatchlist,
      isInWatchlist,
      clearWatchlist,
    }),
    [watchlist, isInitialized, addToWatchlist, removeFromWatchlist, toggleWatchlist, isInWatchlist, clearWatchlist]
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist(): WatchlistContextType {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}
