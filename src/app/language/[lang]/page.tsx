import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Globe, ArrowLeft } from 'lucide-react';
import AnimeCard from '@/components/AnimeCard';
import { CatalogueService } from '@/lib/services/catalogueService';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const capitalized = lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : 'Official';
  return {
    title: `${capitalized} Audio Anime — Watch Official Anime on YouTube | AnimeYT`,
    description: `Stream anime officially licensed and dubbed in ${capitalized} on YouTube via AnimeYT.`,
  };
}

export default async function LanguagePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const capitalized = lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : 'Official';

  const data = await CatalogueService.getCatalogue({
    audioLanguage: lang,
    limit: 50,
  });

  const animeList = data.items || [];

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="glass rounded-[36px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[18px] bg-[#D81B60] flex items-center justify-center text-white shadow-lg">
            <Globe strokeWidth={1.8} className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/explore" className="text-xs text-[#FF8FB4] hover:underline flex items-center gap-1">
                <ArrowLeft strokeWidth={1.8} className="w-3.5 h-3.5" />
                Explore All
              </Link>
            </div>
            <h1 className="text-[28px] sm:text-[32px] font-extrabold text-white tracking-tight">
              {capitalized} Audio Anime
            </h1>
            <p className="text-[14px] text-white/65 mt-0.5">
              Verified official YouTube streams with {capitalized} audio.
            </p>
          </div>
        </div>

        <div className="glass-chip px-4 py-2 rounded-full text-[14px] font-semibold text-[#FF8FB4] self-start md:self-auto">
          {animeList.length} Titles Found
        </div>
      </div>

      {animeList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {animeList.map((anime, index) => (
            <AnimeCard key={anime.id || anime.slug} anime={anime} priority={index < 5} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-[36px] p-12 text-center max-w-lg mx-auto">
          <Globe strokeWidth={1.8} className="w-12 h-12 text-[#FF8FB4] mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2 text-white">No Anime Found</h2>
          <p className="text-white/60 mb-6">
            We currently do not have verified {capitalized} audio titles available. Check back soon or explore our other languages.
          </p>
          <Link href="/explore" className="btn-primary">
            Explore All Anime
          </Link>
        </div>
      )}
    </div>
  );
}
