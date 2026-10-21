import React from 'react';
import Link from 'next/link';
import { Flame, Clock, Sparkles } from 'lucide-react';
import Hero from '@/components/Hero';
import SectionHeader from '@/components/SectionHeader';
import AnimeCard from '@/components/AnimeCard';
import { CatalogueService } from '@/lib/services/catalogueService';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AnimeYT — Discover & Watch Official Anime on YouTube',
  description: 'Stream officially licensed anime episodes for free via verified YouTube embeds.',
};

export default async function HomePage() {
  const { featured, popular, recentlyAdded } = await CatalogueService.getHomePageData();

  const hasContent = featured.length > 0 || popular.length > 0 || recentlyAdded.length > 0;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full py-12">
        <div className="glass rounded-[36px] p-8 sm:p-12 text-center max-w-xl mx-auto flex flex-col items-center">
          <div className="w-16 h-16 rounded-[20px] bg-[#D81B60]/20 flex items-center justify-center text-[#FF8FB4] mb-4 shadow-lg">
            <Sparkles strokeWidth={1.8} className="w-8 h-8" />
          </div>
          <h1 className="text-[26px] font-extrabold text-white mb-2">Catalogue Initializing</h1>
          <p className="text-[14px] text-white/65 mb-6 leading-relaxed max-w-md">
            The database currently has zero indexed titles. Use the AniList metadata importer or administrator portal to populate verified anime and official YouTube episodes.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="btn-primary text-sm px-6">
              Admin Portal
            </Link>
            <Link href="/explore" className="btn-secondary text-sm px-6">
              Explore Catalogue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Compact Hero row */}
      {featured.length > 0 && (
        <section className="w-full">
          <Hero featuredAnime={featured} />
        </section>
      )}

      {/* Section: Popular Anime (5 in a row) */}
      {popular.length > 0 && (
        <section className="w-full">
          <SectionHeader
            icon={<Flame strokeWidth={1.8} className="w-5 h-5 text-[#FF8FB4]" />}
            title="Popular Anime"
            subtitle="Most watched and trending anime"
            viewAllHref="/explore?sort=popular"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {popular.map((anime, index) => (
              <AnimeCard key={anime.id || anime.slug} anime={anime} priority={index < 5} />
            ))}
          </div>
        </section>
      )}

      {/* Section: Recently Added (5 in a row) */}
      {recentlyAdded.length > 0 && (
        <section className="w-full">
          <SectionHeader
            icon={<Clock strokeWidth={1.8} className="w-5 h-5 text-[#FF8FB4]" />}
            title="Recently Added"
            subtitle="Latest additions to the catalogue"
            viewAllHref="/explore?sort=recent"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recentlyAdded.map((anime) => (
              <AnimeCard key={anime.id || anime.slug} anime={anime} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
