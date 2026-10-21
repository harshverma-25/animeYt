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

  return (
    <div className="flex flex-col gap-9 w-full">
      {/* Hero row (Full Width without Trending Now) */}
      <section className="w-full">
        <Hero featuredAnime={featured} />
      </section>

      {/* Section: Popular Anime */}
      <section className="w-full">
        <SectionHeader
          icon={<Flame strokeWidth={1.8} className="w-5 h-5 text-[#FF8FB4]" />}
          title="Popular Anime"
          subtitle="Most watched and trending anime"
          viewAllHref="/explore?sort=popular"
        />

        {/* Card Grid: repeat(auto-fill, minmax(168px, 1fr)), gap 18 */}
        <div
          className="grid gap-[18px]"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))',
          }}
        >
          {popular.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      </section>

      {/* Section: Recently Added */}
      <section className="w-full">
        <SectionHeader
          icon={<Clock strokeWidth={1.8} className="w-5 h-5 text-[#FF8FB4]" />}
          title="Recently Added"
          subtitle="Latest additions to the catalogue"
          viewAllHref="/explore?sort=recent"
        />

        {/* Card Grid: repeat(auto-fill, minmax(168px, 1fr)), gap 18 */}
        <div
          className="grid gap-[18px]"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))',
          }}
        >
          {recentlyAdded.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      </section>
    </div>
  );
}
