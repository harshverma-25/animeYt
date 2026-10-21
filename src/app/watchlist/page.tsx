'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bookmark, Compass, Trash2, AlertTriangle, X } from 'lucide-react';
import AnimeCard from '@/components/AnimeCard';
import { useWatchlist } from '@/hooks/useWatchlist';

export default function WatchlistPage() {
  const { watchlist, count, isInitialized, removeFromWatchlist, clearWatchlist } = useWatchlist();
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const savedItemsRef = useRef<any[]>([]);
  useEffect(() => {
    savedItemsRef.current = savedItems;
  }, [savedItems]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Track the last fetched list of IDs to avoid unnecessary repeated network requests
  const lastFetchedIdsRef = useRef<string>('');

  useEffect(() => {
    if (!isInitialized) return;

    if (watchlist.length === 0) {
      setSavedItems([]);
      setLoading(false);
      lastFetchedIdsRef.current = '';
      return;
    }

    const currentIdsKey = watchlist.slice().sort().join(',');

    // If the savedItems already contain the current items (e.g. user removed an item),
    // we can filter locally without re-fetching everything from the server
    const currentSaved = savedItemsRef.current;
    if (currentSaved.length > 0 && lastFetchedIdsRef.current) {
      const remainingItems = currentSaved.filter((item) => {
        const id = item._id?.toString() || item.id;
        const slug = item.slug;
        return (id && watchlist.includes(id)) || (slug && watchlist.includes(slug));
      });
      if (remainingItems.length === watchlist.length) {
        setSavedItems(remainingItems);
        return;
      }
    }

    // Otherwise, fetch batch from the catalogue API
    let isCancelled = false;
    setLoading(true);

    const idsParam = encodeURIComponent(watchlist.join(','));
    fetch(`/api/catalogue?ids=${idsParam}&limit=100`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load watchlist catalogue items');
        return res.json();
      })
      .then((data) => {
        if (isCancelled) return;
        const fetched: any[] = data.items || [];

        // Preserve the user's saved order (most recently saved first)
        const orderMap = new Map<string, number>();
        watchlist.forEach((idOrSlug, index) => {
          orderMap.set(idOrSlug.toLowerCase(), index);
        });

        const sorted = fetched.slice().sort((a, b) => {
          const aId = (a._id?.toString() || a.id || '').toLowerCase();
          const aSlug = (a.slug || '').toLowerCase();
          const bId = (b._id?.toString() || b.id || '').toLowerCase();
          const bSlug = (b.slug || '').toLowerCase();

          const aIndex = orderMap.has(aId) ? orderMap.get(aId)! : orderMap.get(aSlug) ?? 999;
          const bIndex = orderMap.has(bId) ? orderMap.get(bId)! : orderMap.get(bSlug) ?? 999;
          return aIndex - bIndex;
        });

        setSavedItems(sorted);
        lastFetchedIdsRef.current = currentIdsKey;
        setLoading(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('[WatchlistPage] Error fetching catalogue items:', err);
        // Fallback: don't crash, display whatever was available or empty
        setSavedItems([]);
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [watchlist, isInitialized]);

  const handleRemoveSingle = (anime: any) => {
    const id = anime._id?.toString() || anime.id || anime.slug;
    removeFromWatchlist(id, anime.slug);
    setSavedItems((prev) =>
      prev.filter((item) => {
        const itemId = item._id?.toString() || item.id;
        return itemId !== id && item.slug !== anime.slug;
      })
    );
    setFeedback(`Removed "${anime.title || 'anime'}" from watchlist`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleConfirmClear = () => {
    clearWatchlist();
    setSavedItems([]);
    setShowClearConfirm(false);
    setFeedback('Watchlist cleared');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header Banner */}
      <div className="glass rounded-[36px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[18px] bg-[#D81B60] flex items-center justify-center text-white shadow-lg shrink-0">
            <Bookmark strokeWidth={1.8} className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[28px] sm:text-[32px] font-extrabold text-white tracking-tight">
                My Watchlist
              </h1>
              {isInitialized && count > 0 && (
                <span className="px-3 py-1 text-[13px] font-bold rounded-full bg-[#D81B60]/30 border border-[#D81B60]/50 text-[#FF8FB4]">
                  {count} {count === 1 ? 'Anime' : 'Animes'}
                </span>
              )}
            </div>
            <p className="text-[14px] text-white/65 mt-0.5">
              Keep track of your favorite anime series available legally on YouTube.
            </p>
          </div>
        </div>

        {/* Action Controls & Clear Watchlist */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          {feedback && (
            <span className="text-[13px] font-medium text-[#FF8FB4] bg-[#D81B60]/20 border border-[#D81B60]/30 px-3 py-1.5 rounded-full transition-all">
              {feedback}
            </span>
          )}

          {isInitialized && count > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="glass-chip inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-white/70 hover:text-white hover:border-red-500/40 hover:bg-red-500/10 transition-all"
              aria-label="Clear all anime from watchlist"
            >
              <Trash2 strokeWidth={1.8} className="w-4 h-4 text-red-400" />
              <span>Clear Watchlist</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!isInitialized || loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass rounded-[26px] p-2.5 h-[280px] animate-pulse flex flex-col justify-between">
              <div className="w-full aspect-[16/10] bg-white/10 rounded-[18px]" />
              <div className="space-y-2 py-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
              <div className="h-5 bg-white/5 rounded-full w-16" />
            </div>
          ))}
        </div>
      ) : savedItems.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {savedItems.map((anime) => (
              <AnimeCard
                key={anime._id?.toString() || anime.id || anime.slug}
                anime={anime}
                onRemove={() => handleRemoveSingle(anime)}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Empty Watchlist State */
        <div className="glass rounded-[36px] p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white/50 mb-4 shadow-inner">
            <Bookmark strokeWidth={1.8} className="w-8 h-8" />
          </div>
          <h2 className="text-[20px] font-bold text-white mb-2">Your Watchlist is Empty</h2>
          <p className="text-[14px] text-white/60 mb-6 leading-relaxed text-center">
            Save anime titles to your watchlist to easily track and resume your favorite official YouTube anime streams.
          </p>
          <Link href="/explore" className="btn-primary gap-2 text-[14px] px-6">
            <Compass strokeWidth={1.8} className="w-4 h-4" />
            <span>Discover Anime</span>
          </Link>
        </div>
      )}

      {/* Confirmation Modal for Clearing Watchlist */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="glass-large rounded-[32px] p-6 sm:p-8 max-w-md w-full border border-white/20 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertTriangle strokeWidth={2} className="w-5 h-5" />
              </div>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close dialog"
              >
                <X strokeWidth={2} className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 id="clear-modal-title" className="text-[20px] font-bold text-white">
                Clear entire watchlist?
              </h3>
              <p className="text-[14px] text-white/65 mt-1.5 leading-relaxed">
                This will remove all {count} saved {count === 1 ? 'title' : 'titles'} from your browser storage. You can always add them again later.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-5 py-2.5 rounded-full text-[14px] font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="px-6 py-2.5 rounded-full text-[14px] font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg transition-all"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
