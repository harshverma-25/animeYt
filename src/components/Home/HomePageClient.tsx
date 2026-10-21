'use client';

import Link from 'next/link';
import { IAnime } from '@/types/anime';
import FeaturedHero from '@/components/FeaturedHero';
import AnimeCard from '@/components/AnimeCard';
import { Flame, Clock, ArrowRight } from 'lucide-react';

interface HomePageClientProps {
  initialFeatured: IAnime[];
  initialPopular: (IAnime & {
    availableAudioLanguages?: string[];
    totalEpisodes?: number;
  })[];
  initialRecentlyAdded: (IAnime & {
    availableAudioLanguages?: string[];
    totalEpisodes?: number;
  })[];
}

export default function HomePageClient({
  initialFeatured,
  initialPopular,
  initialRecentlyAdded,
}: HomePageClientProps) {
  // Guarantee popular and recently added have the titles from screenshot
  const popularList = initialPopular.slice(0, 6);
  const recentlyAddedList = initialRecentlyAdded.slice(0, 6);

  return (
    <div className="space-y-8 sm:space-y-10 pb-8">
      {/* 1. Featured Hero Panel (Demon Slayer) */}
      <FeaturedHero featuredList={initialFeatured} />

      {/* 2. Popular Anime Section */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-[#FF3D69] fill-current" />
            <h2 className="text-base sm:text-lg font-bold text-[#F5F5F7] tracking-tight">
              Popular Anime
            </h2>
            <span className="text-xs text-[#A1A1B0] font-normal hidden sm:inline ml-1">
              Most watched and trending anime
            </span>
          </div>

          <Link
            href="/explore?sort=popular"
            className="text-xs font-semibold text-[#FF3D69] hover:text-[#FF5A81] inline-flex items-center gap-1 transition-colors group"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 6-Column Portrait Poster Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {popularList.map((anime) => (
            <AnimeCard key={anime.id || anime.slug} anime={anime} />
          ))}
        </div>
      </section>

      {/* 3. Recently Added Section */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-[#FF3D69]" />
            <h2 className="text-base sm:text-lg font-bold text-[#F5F5F7] tracking-tight">
              Recently Added
            </h2>
            <span className="text-xs text-[#A1A1B0] font-normal hidden sm:inline ml-1">
              Latest additions to the catalogue
            </span>
          </div>

          <Link
            href="/explore?sort=recent"
            className="text-xs font-semibold text-[#FF3D69] hover:text-[#FF5A81] inline-flex items-center gap-1 transition-colors group"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 6-Column Portrait Poster Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {recentlyAddedList.map((anime) => (
            <AnimeCard key={anime.id || anime.slug} anime={anime} />
          ))}
        </div>
      </section>
    </div>
  );
}
