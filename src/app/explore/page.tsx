'use client';
import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Compass, Filter, ArrowUpDown } from 'lucide-react';
import AnimeCard from '@/components/AnimeCard';
import { ANIME_LIST, GENRE_COLORS } from '@/data/anime';

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialGenre = searchParams.get('genre') || 'All';
  const initialLang = searchParams.get('lang') || 'All';
  const initialSort = searchParams.get('sort') || 'popular';

  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedLang, setSelectedLang] = useState(initialLang);
  const [sortBy, setSortBy] = useState(initialSort);
  const [visibleCount, setVisibleCount] = useState(8);

  const genres = ['All', 'Action', 'Adventure', 'Comedy', 'Fantasy', 'Romance', 'Sci-Fi', 'Thriller'];
  const languages = ['All', 'Hindi', 'English', 'Japanese'];

  const filteredAnime = useMemo(() => {
    let list = [...ANIME_LIST];

    if (selectedGenre !== 'All') {
      list = list.filter((a) =>
        a.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
      );
    }

    if (selectedLang !== 'All') {
      list = list.filter((a) =>
        a.languages.some((l) => l.toLowerCase() === selectedLang.toLowerCase())
      );
    }

    if (sortBy === 'popular') {
      list.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
    } else if (sortBy === 'recent') {
      list.sort((a, b) => b.releaseYear - a.releaseYear);
    } else if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [selectedGenre, selectedLang, sortBy]);

  const displayed = filteredAnime.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAnime.length;

  return (
    <div className="flex flex-col gap-7 w-full">
      {/* Header Glass Card */}
      <div className="glass rounded-[36px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[18px] bg-[#D81B60] flex items-center justify-center text-white shadow-lg">
            <Compass strokeWidth={1.8} className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[26px] sm:text-[30px] font-extrabold text-white tracking-tight">
              Explore Anime Catalogue
            </h1>
            <p className="text-[14px] text-white/65 mt-0.5">
              Browse legally streamed anime on YouTube by genre, language, or popularity.
            </p>
          </div>
        </div>
        <div className="text-[14px] font-semibold text-[#FF8FB4] glass-chip px-4 py-2 rounded-full self-start md:self-auto">
          {filteredAnime.length} Titles Available
        </div>
      </div>

      {/* Glass Filter Bar */}
      <div className="glass rounded-[30px] p-5 flex flex-col gap-4">
        {/* Genre Chips with Colored Dots */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 flex items-center gap-1.5">
            <Filter strokeWidth={1.8} className="w-3.5 h-3.5" />
            GENRES
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {genres.map((g) => {
              const isActive = selectedGenre.toLowerCase() === g.toLowerCase();
              const dotColor = GENRE_COLORS[g];
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGenre(g)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-[#1A1428] shadow-md'
                      : 'glass-chip text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {dotColor && (
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: dotColor }}
                    />
                  )}
                  <span>{g}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language Chips & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 mr-1">
              AUDIO:
            </span>
            {languages.map((l) => {
              const isActive = selectedLang.toLowerCase() === l.toLowerCase();
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setSelectedLang(l)}
                  className={`px-3 py-1 rounded-full text-[12.5px] font-medium transition-all ${
                    isActive
                      ? 'bg-[#D81B60] text-white shadow-sm'
                      : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <ArrowUpDown strokeWidth={1.8} className="w-4 h-4 text-white/50" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="glass rounded-full px-4 py-2 text-[13px] font-semibold text-white bg-[#1A122E] outline-none cursor-pointer border border-white/20"
              aria-label="Sort anime by"
            >
              <option value="popular" className="bg-[#1A122E] text-white">Most Popular</option>
              <option value="recent" className="bg-[#1A122E] text-white">Release Year</option>
              <option value="title" className="bg-[#1A122E] text-white">Title A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Anime Grid */}
      {displayed.length > 0 ? (
        <div
          className="grid gap-[18px]"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))',
          }}
        >
          {displayed.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-[32px] p-12 text-center flex flex-col items-center justify-center my-6">
          <p className="text-[18px] font-semibold text-white mb-2">No anime matches your filter.</p>
          <p className="text-[14px] text-white/60 mb-5">Try resetting or selecting another genre or audio track.</p>
          <button
            onClick={() => {
              setSelectedGenre('All');
              setSelectedLang('All');
            }}
            className="btn-secondary text-[14px] px-6 py-2.5"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Glass Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="glass btn-secondary px-8 py-3 rounded-full text-[14px] font-semibold text-white hover:bg-white/20 transition-all shadow-lg"
          >
            Load More Titles
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="glass rounded-[36px] p-8 text-center text-white/60">Loading Explore...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
