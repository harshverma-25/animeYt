'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Bookmark, Compass } from 'lucide-react';
import AnimeCard from '@/components/AnimeCard';
import { ANIME_LIST } from '@/data/anime';

export default function WatchlistPage() {
  // Demo saved anime (e.g. Demon Slayer & Solo Leveling)
  const [savedItems, setSavedItems] = useState(ANIME_LIST.slice(0, 3));

  const handleClear = () => {
    setSavedItems([]);
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header Glass Card */}
      <div className="glass rounded-[36px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[18px] bg-[#D81B60] flex items-center justify-center text-white shadow-lg">
            <Bookmark strokeWidth={1.8} className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-extrabold text-white tracking-tight">
              My Watchlist
            </h1>
            <p className="text-[14px] text-white/65 mt-0.5">
              Keep track of your favorite anime series available on YouTube.
            </p>
          </div>
        </div>

        {savedItems.length > 0 && (
          <button
            onClick={handleClear}
            className="glass-chip px-4 py-2 rounded-full text-[13px] font-semibold text-white/70 hover:text-white transition-all self-start md:self-auto"
          >
            Clear Watchlist
          </button>
        )}
      </div>

      {/* Grid or Empty State */}
      {savedItems.length > 0 ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          
        >
          {savedItems.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-[36px] p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white/50 mb-4">
            <Bookmark strokeWidth={1.8} className="w-8 h-8" />
          </div>
          <h2 className="text-[20px] font-bold text-white mb-2">Your Watchlist is Empty</h2>
          <p className="text-[14px] text-white/60 mb-6 leading-relaxed">
            Save anime titles to your watchlist to easily pick up where you left off.
          </p>
          <Link href="/explore" className="btn-primary gap-2 text-[14px]">
            <Compass strokeWidth={1.8} className="w-4 h-4" />
            <span>Discover Anime</span>
          </Link>
        </div>
      )}
    </div>
  );
}
