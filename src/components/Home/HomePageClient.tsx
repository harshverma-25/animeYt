'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IAnime } from '@/types/anime';
import AnimeCard from '@/components/AnimeCard';
import FeaturedStrip from '@/components/FeaturedStrip';
import LanguageFilter from '@/components/LanguageFilter';
import { Search, Flame, Clock, Database, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
  availableAudio: string[];
}

export default function HomePageClient({
  initialFeatured,
  initialPopular,
  initialRecentlyAdded,
  availableAudio,
}: HomePageClientProps) {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Filter items based on active language selection
  const filterByLang = (
    list: (IAnime & { availableAudioLanguages?: string[]; totalEpisodes?: number })[]
  ) => {
    if (selectedLanguage === 'All') return list;
    return list.filter((a) =>
      a.availableAudioLanguages?.some(
        (l) => l.toLowerCase() === selectedLanguage.toLowerCase()
      )
    );
  };

  const filteredPopular = filterByLang(initialPopular);
  const filteredRecentlyAdded = filterByLang(initialRecentlyAdded);

  const isEmpty = initialPopular.length === 0 && initialRecentlyAdded.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-[#191920] border border-[#30303A]">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A2A2B2]" />
          <input
            type="text"
            placeholder="Search anime title, genre, or keyword (e.g. Mob Psycho, Spy x Family, Tokyo Revengers)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#101015] border border-[#30303A] rounded-lg text-[#F4F4F7] placeholder-[#A2A2B2]/60 focus:outline-none focus:border-[#FF3D69] focus:ring-1 focus:ring-[#FF3D69] transition-all"
          />
        </form>

        {/* Audio Language Filter Tabs */}
        <LanguageFilter
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
          availableLanguages={availableAudio.length > 0 ? availableAudio : ['All', 'Hindi', 'English', 'Japanese']}
        />
      </div>

      {/* Featured Anime Strip */}
      {initialFeatured.length > 0 && <FeaturedStrip animeList={initialFeatured} />}

      {/* Empty Database State */}
      {isEmpty && (
        <div className="text-center py-16 px-4 rounded-2xl bg-[#191920] border border-[#30303A] space-y-4">
          <Database className="w-10 h-10 text-[#FF3D69] mx-auto opacity-80" />
          <h3 className="text-lg font-bold text-[#F4F4F7]">Catalogue Is Currently Empty</h3>
          <p className="text-xs text-[#A2A2B2] max-w-md mx-auto">
            No anime entries are loaded in your database yet. You can import verified official anime or run the seed command in the Admin portal.
          </p>
          <div className="pt-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF3D69] text-white text-xs font-semibold hover:bg-[#FF5A81] transition-colors"
            >
              Open Admin & Seed Initial Catalogue
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Popular Anime Section */}
      {!isEmpty && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#30303A] pb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#FF3D69]" />
              <h2 className="text-sm sm:text-base font-bold text-[#F4F4F7] tracking-tight">
                Popular Anime
              </h2>
              <span className="text-[11px] text-[#A2A2B2] font-normal hidden sm:inline">
                Verified official YouTube releases
              </span>
            </div>

            <Link
              href="/explore?sort=popular"
              className="text-xs text-[#A2A2B2] hover:text-[#FF3D69] flex items-center gap-1 transition-colors font-medium"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {filteredPopular.length === 0 ? (
            <p className="text-xs text-[#A2A2B2] py-6 text-center">
              No popular anime found for {selectedLanguage} audio.
            </p>
          ) : (
            /* Desktop: 6 cards per row, Mobile: 2 columns */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {filteredPopular.slice(0, 12).map((anime) => (
                <AnimeCard key={anime.id || anime.slug} anime={anime} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Recently Added Section */}
      {!isEmpty && (
        <section className="space-y-3 pt-4">
          <div className="flex items-center justify-between border-b border-[#30303A] pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF3D69]" />
              <h2 className="text-sm sm:text-base font-bold text-[#F4F4F7] tracking-tight">
                Recently Added
              </h2>
              <span className="text-[11px] text-[#A2A2B2] font-normal hidden sm:inline">
                Latest additions to the catalogue
              </span>
            </div>

            <Link
              href="/explore?sort=recent"
              className="text-xs text-[#A2A2B2] hover:text-[#FF3D69] flex items-center gap-1 transition-colors font-medium"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {filteredRecentlyAdded.length === 0 ? (
            <p className="text-xs text-[#A2A2B2] py-6 text-center">
              No recently added anime found for {selectedLanguage} audio.
            </p>
          ) : (
            /* Desktop: 6 cards per row, Mobile: 2 columns */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {filteredRecentlyAdded.slice(0, 12).map((anime) => (
                <AnimeCard key={anime.id || anime.slug} anime={anime} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
