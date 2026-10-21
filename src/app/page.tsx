import React from 'react';
import { Flame, Clock } from 'lucide-react';
import Hero from '@/components/Hero';
import SectionHeader from '@/components/SectionHeader';
import AnimeCard from '@/components/AnimeCard';
import {
  getFeaturedAnime,
  getPopularAnime,
  getRecentlyAddedAnime,
} from '@/data/anime';

export const metadata = {
  title: 'AnimeYT — Discover & Watch Official Anime on YouTube',
  description: 'Stream officially licensed anime episodes for free via verified YouTube embeds.',
};

export default function HomePage() {
  const featured = getFeaturedAnime();
  const popular = getPopularAnime();
  const recentlyAdded = getRecentlyAddedAnime();

  // Show 5 or 10 titles to form clean 5-column rows
  const displayPopular = popular.slice(0, 5);
  const displayRecentlyAdded = recentlyAdded.slice(0, 5);

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Compact Hero row */}
      <section className="w-full">
        <Hero featuredAnime={featured} />
      </section>

      {/* Section: Popular Anime (5 in a row) */}
      <section className="w-full">
        <SectionHeader
          icon={<Flame strokeWidth={1.8} className="w-5 h-5 text-[#FF8FB4]" />}
          title="Popular Anime"
          subtitle="Most watched and trending anime"
          viewAllHref="/explore?sort=popular"
        />

        {/* 5 Cards in a row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayPopular.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      </section>

      {/* Section: Recently Added (5 in a row) */}
      <section className="w-full">
        <SectionHeader
          icon={<Clock strokeWidth={1.8} className="w-5 h-5 text-[#FF8FB4]" />}
          title="Recently Added"
          subtitle="Latest additions to the catalogue"
          viewAllHref="/explore?sort=recent"
        />

        {/* 5 Cards in a row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayRecentlyAdded.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      </section>
    </div>
  );
}
