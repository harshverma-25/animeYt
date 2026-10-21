'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';
import AnimeCard from '@/components/AnimeCard';
import { getAnimeByGenre, GENRE_COLORS } from '@/data/anime';

export default function GenrePage() {
  const params = useParams();
  const genreParam = (params?.genre as string) || '';
  const genreName = genreParam.charAt(0).toUpperCase() + genreParam.slice(1);
  const dotColor = GENRE_COLORS[genreName] || '#FF5A7A';
  const animeList = getAnimeByGenre(genreParam);

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header Glass Card */}
      <div className="glass rounded-[36px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-[18px] flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: dotColor }}
          >
            <Sparkles strokeWidth={1.8} className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/explore" className="text-xs text-[#FF8FB4] hover:underline flex items-center gap-1">
                <ArrowLeft strokeWidth={1.8} className="w-3.5 h-3.5" />
                All Genres
              </Link>
            </div>
            <h1 className="text-[28px] sm:text-[32px] font-extrabold text-white tracking-tight">
              {genreName} Anime
            </h1>
            <p className="text-[14px] text-white/65 mt-0.5">
              Explore officially licensed {genreName} anime series streamed directly on YouTube.
            </p>
          </div>
        </div>

        <div className="glass-chip px-4 py-2 rounded-full text-[14px] font-semibold text-[#FF8FB4] self-start md:self-auto">
          {animeList.length} Anime in {genreName}
        </div>
      </div>

      {/* Anime Grid */}
      {animeList.length > 0 ? (
        <div
          className="grid gap-[18px]"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))',
          }}
        >
          {animeList.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-[32px] p-12 text-center my-6">
          <p className="text-lg font-semibold text-white mb-2">No anime currently found for {genreName}.</p>
          <p className="text-sm text-white/60 mb-5">Try checking out another genre from the sidebar.</p>
          <Link href="/explore" className="btn-primary text-sm px-6">
            Explore All Anime
          </Link>
        </div>
      )}
    </div>
  );
}
