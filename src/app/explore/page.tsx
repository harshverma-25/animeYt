'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { IAnime, PaginatedResult } from '@/types/anime';
import AnimeCard from '@/components/AnimeCard';
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL state synchronization
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [audioLang, setAudioLang] = useState(searchParams.get('audio') || 'All');
  const [genre, setGenre] = useState(searchParams.get('genre') || 'All');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popular');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<
    PaginatedResult<
      IAnime & {
        availableAudioLanguages?: string[];
        totalEpisodes?: number;
      }
    >
  >({
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
    hasMore: false,
  });

  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableAudioLanguages, setAvailableAudioLanguages] = useState<string[]>([]);

  // Fetch catalogue function
  const fetchCatalogue = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('query', query.trim());
      if (audioLang !== 'All') params.set('audio', audioLang);
      if (genre !== 'All') params.set('genre', genre);
      if (sortBy) params.set('sort', sortBy);
      params.set('page', page.toString());
      params.set('limit', '18');

      const res = await fetch(`/api/catalogue?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Catalogue API returned status ${res.status}`);
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch catalogue data');
      }

      setData(json.data);
      if (json.filters?.genres) {
        setAvailableGenres(json.filters.genres);
      }
      if (json.filters?.audioLanguages) {
        setAvailableAudioLanguages(json.filters.audioLanguages);
      }
    } catch (err) {
      console.error('Error fetching explore page data:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [query, audioLang, genre, sortBy, page]);

  useEffect(() => {
    fetchCatalogue();
  }, [fetchCatalogue]);

  // Sync state to URL without reloading
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (audioLang !== 'All') params.set('audio', audioLang);
    if (genre !== 'All') params.set('genre', genre);
    if (sortBy !== 'popular') params.set('sort', sortBy);
    if (page > 1) params.set('page', page.toString());

    const newUrl = `/explore${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [query, audioLang, genre, sortBy, page, router]);

  const handleResetFilters = () => {
    setQuery('');
    setAudioLang('All');
    setGenre('All');
    setSortBy('popular');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Filter Bar Header */}
      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-[#191920] border border-[#30303A]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#F4F4F7] tracking-tight">
              Explore Anime Catalogue
            </h1>
            <p className="text-xs text-[#A2A2B2] mt-0.5">
              Browse verified official releases available legally on YouTube.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#A2A2B2]">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-[#101015] border border-[#30303A] rounded-lg text-[#F4F4F7] focus:outline-none focus:border-[#FF3D69]"
            >
              <option value="popular">Popularity</option>
              <option value="recent">Recently Added</option>
              <option value="title">Title (A-Z)</option>
              <option value="year">Release Year</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A2A2B2]" />
          <input
            type="text"
            placeholder="Search by anime title, character, or synopsis..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#101015] border border-[#30303A] rounded-lg text-[#F4F4F7] placeholder-[#A2A2B2]/60 focus:outline-none focus:border-[#FF3D69] focus:ring-1 focus:ring-[#FF3D69]"
          />
        </div>

        {/* Audio Language Filter Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-[#A2A2B2] mr-1.5 font-medium flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF3D69]" />
            Audio:
          </span>
          {['All', ...(availableAudioLanguages.length > 0 ? availableAudioLanguages : ['Hindi', 'English', 'Japanese'])].map(
            (lang) => {
              const active = audioLang.toLowerCase() === lang.toLowerCase();
              return (
                <button
                  key={lang}
                  onClick={() => {
                    setAudioLang(lang);
                    setPage(1);
                  }}
                  className={`px-3 py-1 text-xs rounded-lg border font-medium transition-colors ${
                    active
                      ? 'bg-[#FF3D69] text-white border-[#FF3D69]'
                      : 'bg-[#101015] text-[#A2A2B2] border-[#30303A] hover:text-[#F4F4F7] hover:border-[#454553]'
                  }`}
                >
                  {lang}
                </button>
              );
            }
          )}
        </div>

        {/* Genre Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#30303A]/60">
          <span className="text-xs text-[#A2A2B2] mr-1.5 font-medium">Genre:</span>
          {['All', ...availableGenres].map((g) => {
            const active = genre.toLowerCase() === g.toLowerCase();
            return (
              <button
                key={g}
                onClick={() => {
                  setGenre(g);
                  setPage(1);
                }}
                className={`px-2.5 py-0.5 text-xs rounded-md border transition-colors ${
                  active
                    ? 'bg-[#202028] text-[#FF5A81] border-[#FF3D69]/50 font-semibold'
                    : 'bg-[#101015] text-[#A2A2B2] border-[#30303A] hover:text-[#F4F4F7]'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header / Meta */}
      <div className="flex items-center justify-between text-xs text-[#A2A2B2]">
        <div>
          Showing <span className="text-[#F4F4F7] font-semibold">{data.items.length}</span> of{' '}
          <span className="text-[#F4F4F7] font-semibold">{data.total}</span> anime titles
        </div>

        {(query || audioLang !== 'All' || genre !== 'All' || sortBy !== 'popular') && (
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-[#FF5A81] hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-7 h-7 text-[#FF3D69] animate-spin" />
          <span className="text-xs text-[#A2A2B2]">Loading anime catalogue...</span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-6 rounded-xl bg-red-950/20 border border-red-500/30 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto" />
          <p className="text-xs font-semibold text-red-200">{error}</p>
          <button
            onClick={fetchCatalogue}
            className="text-xs text-[#FF3D69] underline hover:text-[#FF5A81]"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && data.items.length === 0 && (
        <div className="py-20 text-center p-6 rounded-2xl bg-[#191920] border border-[#30303A] space-y-3">
          <p className="text-sm font-semibold text-[#F4F4F7]">No anime match your criteria</p>
          <p className="text-xs text-[#A2A2B2] max-w-sm mx-auto">
            Try adjusting your search query, selecting &quot;All&quot; audio languages, or picking another genre.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-[#202028] text-xs text-[#F4F4F7] border border-[#30303A] hover:bg-[#282834]"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Anime Grid */}
      {!loading && !error && data.items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {data.items.map((anime) => (
            <AnimeCard key={anime.id || anime.slug} anime={anime} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-[#191920] border border-[#30303A] text-[#F4F4F7] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#202028]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <span className="text-xs text-[#A2A2B2] px-3 font-mono">
            Page {data.page} of {data.totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-[#191920] border border-[#30303A] text-[#F4F4F7] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#202028]"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-7 h-7 text-[#FF3D69] animate-spin" />
          <span className="text-xs text-[#A2A2B2]">Loading explore catalogue...</span>
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
