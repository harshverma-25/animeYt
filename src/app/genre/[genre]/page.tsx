import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';
import AnimeCard from '@/components/AnimeCard';
import { GENRE_COLORS } from '@/data/anime';
import { CatalogueService } from '@/lib/services/catalogueService';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ genre: string }>;
}): Promise<Metadata> {
  const { genre } = await params;
  const genreName = genre ? genre.charAt(0).toUpperCase() + genre.slice(1) : 'Action';
  return {
    title: `${genreName} Anime — Watch Official Anime on YouTube | AnimeYT`,
    description: `Browse officially licensed ${genreName} anime series streamed directly on YouTube on AnimeYT.`,
  };
}

export default async function GenrePage({
  params,
}: {
  params: Promise<{ genre: string }>;
}) {
  const { genre } = await params;
  const genreName = genre ? genre.charAt(0).toUpperCase() + genre.slice(1) : 'Action';
  const dotColor = GENRE_COLORS[genreName] || '#FF5A7A';

  const data = await CatalogueService.getCatalogue({
    genre,
    limit: 50,
  });

  const animeList = data.items || [];

  return (
    <div className="flex flex-col gap-8 w-full">
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
              Officially licensed {genreName} anime series streamed directly on YouTube.
            </p>
          </div>
        </div>

        <div className="glass-chip px-4 py-2 rounded-full text-[14px] font-semibold text-[#FF8FB4] self-start md:self-auto">
          {animeList.length} Anime in {genreName}
        </div>
      </div>

      {animeList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {animeList.map((anime, index) => (
            <AnimeCard key={anime.id || anime.slug} anime={anime} priority={index < 5} />
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
