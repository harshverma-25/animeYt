'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Globe, ArrowLeft } from 'lucide-react';
import AnimeCard from '@/components/AnimeCard';

export default function LanguagePage() {
  const params = useParams();
  const lang = (params?.lang as string) || '';
  const capitalized = lang.charAt(0).toUpperCase() + lang.slice(1);

  const [animeList, setAnimeList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lang) return;
    setLoading(true);
    fetch(`/api/catalogue?lang=${encodeURIComponent(lang)}&limit=50`)
      .then((r) => r.json())
      .then((data) => {
        setAnimeList(data.items || []);
        setLoading(false);
      })
      .catch(() => {
        setAnimeList([]);
        setLoading(false);
      });
  }, [lang]);

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

      {loading ? (
        <div className="glass rounded-[32px] p-12 text-center text-white/60">
          Loading {capitalized} anime...
        </div>
      ) : animeList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {animeList.map((anime) => (
            <AnimeCard key={anime.id || anime.slug} anime={anime} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-[32px] p-12 text-center my-6">
          <p className="text-lg font-semibold text-white mb-2">No anime currently found in {capitalized}.</p>
          <p className="text-sm text-white/60 mb-5">Browse our full catalogue for more available languages.</p>
          <Link href="/explore" className="btn-primary text-sm px-6">
            Browse Catalogue
          </Link>
        </div>
      )}
    </div>
  );
}
