'use client';
import React, { useState } from 'react';
import { Bookmark, Check, Share2 } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';

interface WatchPageActionsProps {
  animeId: string;
  slug: string;
  title: string;
}

export default function WatchPageActions({ animeId, slug, title }: WatchPageActionsProps) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const [copied, setCopied] = useState(false);

  const isSaved = isInWatchlist(animeId, slug);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={() => toggleWatchlist(animeId, slug)}
        className={`glass-chip inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
          isSaved ? 'text-[#FF8FB4] border-[#FF8FB4]/50 bg-[#D81B60]/20' : 'text-white/80 hover:text-white'
        }`}
        aria-label={isSaved ? `In Watchlist for ${title}` : `Add ${title} to Watchlist`}
      >
        {isSaved ? (
          <>
            <Check strokeWidth={2} className="w-3.5 h-3.5 text-[#FF8FB4]" />
            <span>In Watchlist</span>
          </>
        ) : (
          <>
            <Bookmark strokeWidth={1.8} className="w-3.5 h-3.5" />
            <span>Add to Watchlist</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleShare}
        className="glass-chip inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold text-white/80 hover:text-white transition-all"
        aria-label="Share Episode Link"
      >
        {copied ? (
          <>
            <Check strokeWidth={1.8} className="w-3.5 h-3.5 text-[#FF8FB4]" />
            <span>Link Copied</span>
          </>
        ) : (
          <>
            <Share2 strokeWidth={1.8} className="w-3.5 h-3.5 text-[#FF8FB4]" />
            <span>Share Episode</span>
          </>
        )}
      </button>
    </div>
  );
}
