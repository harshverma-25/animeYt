'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { IAnime, PaginatedResult } from '@/types/anime';
import AnimeCard from '@/components/AnimeCard';
import {
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

  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [audioLang, setAudioLang] = useState(searchParams.get('audio') || 'All');
  const [genre, setGenre] = useState(searchParams.get('genre') || 'All');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popular');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

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

  // Sync state if URL query params change (e.g. from sidebar clicks)
  useEffect(() => {
    const qParam = searchParams.get('query') || '';
    const aParam = searchParams.get('audio') || 'All';
    const gParam = searchParams.get('genre') || 'All';
    const sParam = searchParams.get('sort') || 'popular';
    const pParam = parseInt(searchParams.get('page') || '1', 10);

    setQuery(qParam);
    setAudioLang(aParam);
    setGenre(gParam);
    setSortBy(sParam);
    setPage(pParam);
  }, [searchParams]);

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

  const handleResetFilters = () => {
    setQuery('');
    setAudioLang('All');
    setGenre('All');
    setSortBy('popular');
    setPage(1);
    router.push('/explore');
  };

  const handleAudioSelect = (lang: string) => {
    setAudioLang(lang);
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (lang === 'All') params.delete('audio');
    else params.set('audio', lang);
    params.set('page', '1');
    router.push(`/explore?${params.toString()}`);
  };

  const handleGenreSelect = (g: string) => {
    setGenre(g);
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (g === 'All') params.delete('genre');
    else params.set('genre', g);
    params.set('page', '1');
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="p-5 rounded-2xl bg-[#16161F]/90 backdrop-blur-md border border-[#282835] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#F5F5F7] tracking-tight">
              Explore Anime Catalogue
            </h1>
            <p className="text-xs text-[#A1A1B0] mt-0.5">
              Browse verified official releases available legally on YouTube.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#A1A1B0]">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
                const params = new URLSearchParams(searchParams.toString());
                params.set('sort', e.target.value);
                params.set('page', '1');
                router.push(`/explore?${params.toString()}`);
              }}
              className="px-3 py-1.5 text-xs bg-[#111117] border border-[#2D2D3A] rounded-xl text-[#F5F5F7] focus:outline-none focus:border-[#FF3D69]"
            >
              <option value="popular">Popularity</option>
              <option value="recent">Recently Added</option>
              <option value="title">Title (A-Z)</option>
              <option value="year">Release Year</option>
            </select>
          </div>
        </div>

        {/* Audio Languages Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-[#A1A1B0] mr-1.5 font-medium flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF3D69]" />
            Audio:
          </span>
          {['All', ...(availableAudioLanguages.length > 0 ? availableAudioLanguages : ['Hindi', 'English', 'Japanese'])].map(
            (lang) => {
              const active = audioLang.toLowerCase() === lang.toLowerCase();
              return (
                <button
                  key={lang}
                  onClick={() => handleAudioSelect(lang)}
                  className={`px-3 py-1 text-xs rounded-xl border font-medium transition-colors ${
                    active
                      ? 'bg-[#FF3D69] text-white border-[#FF3D69] shadow-sm'
                      : 'bg-[#111117] text-[#A1A1B0] border-[#2B2B38] hover:text-[#F5F5F7] hover:border-[#383848]'
                  }`}
                >
                  {lang}
                </button>
              );
            }
          )}
        </div>

        {/* Genres Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#262633]/80">
          <span className="text-xs text-[#A1A1B0] mr-1.5 font-medium">Genre:</span>
          {['All', ...availableGenres].map((g) => {
            const active = genre.toLowerCase() === g.toLowerCase();
            return (
              <button
                key={g}
                onClick={() => handleGenreSelect(g)}
                className={`px-2.5 py-0.5 text-xs rounded-lg border transition-colors ${
                  active
                    ? 'bg-[#381622] text-[#FF5A81] border-[#FF3D69]/40 font-semibold'
                    : 'bg-[#111117] text-[#A1A1B0] border-[#2B2B38] hover:text-[#F5F5F7]'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Meta Bar */}
      <div className="flex items-center justify-between text-xs text-[#A1A1B0]">
        <div>
          Showing <span className="text-[#F5F5F7] font-semibold">{data.items.length}</span> of{' '}
          <span className="text-[#F5F5F7] font-semibold">{data.total}</span> anime titles
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
          <span className="text-xs text-[#A1A1B0]">Loading anime catalogue...</span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/30 text-center space-y-2">
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
        <div className="py-20 text-center p-6 rounded-2xl bg-[#16161F] border border-[#282835] space-y-3">
          <p className="text-sm font-semibold text-[#F5F5F7]">No anime match your criteria</p>
          <p className="text-xs text-[#A1A1B0] max-w-sm mx-auto">
            Try adjusting your query, selecting &quot;All&quot; audio languages, or picking another genre.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-[#202029] text-xs text-[#F5F5F7] border border-[#30303B] hover:bg-[#282835]"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* 6-Column Portrait Poster Grid */}
      {!loading && !error && data.items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {data.items.map((anime) => (
            <AnimeCard key={anime.id || anime.slug} anime={anime} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs bg-[#16161F] border border-[#282835] text-[#F5F5F7] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#202029]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <span className="text-xs text-[#A1A1B0] px-3 font-mono">
            Page {data.page} of {data.totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs bg-[#16161F] border border-[#282835] text-[#F5F5F7] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#202029]"
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
          <span className="text-xs text-[#A1A1B0]">Loading explore catalogue...</span>
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
