'use client';
import React, { useState } from 'react';
import { Bookmark, Check } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';

interface AnimeWatchlistButtonProps {
  animeId: string;
  slug: string;
  title: string;
}

export default function AnimeWatchlistButton({ animeId, slug, title }: AnimeWatchlistButtonProps) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const [feedback, setFeedback] = useState<string | null>(null);

  const isSaved = isInWatchlist(animeId, slug);

  const handleClick = () => {
    const added = toggleWatchlist(animeId, slug);
    setFeedback(added ? `Added "${title}" to Watchlist` : `Removed from Watchlist`);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        className={`btn-secondary gap-2 text-[15px] px-6 transition-all ${
          isSaved ? 'border-[#FF8FB4]/50 bg-white/10' : ''
        }`}
        aria-label={isSaved ? `In Watchlist for ${title}` : `Add ${title} to Watchlist`}
      >
        {isSaved ? (
          <>
            <Check strokeWidth={2} className="w-5 h-5 text-[#FF8FB4]" />
            <span className="text-white font-semibold">In Watchlist</span>
          </>
        ) : (
          <>
            <Bookmark strokeWidth={1.8} className="w-5 h-5" />
            <span>Add to Watchlist</span>
          </>
        )}
      </button>
      {feedback && (
        <span className="text-[13px] font-medium text-[#FF8FB4] bg-[#D81B60]/20 border border-[#D81B60]/30 px-3 py-1.5 rounded-full transition-all animate-in fade-in">
          {feedback}
        </span>
      )}
    </div>
  );
}
