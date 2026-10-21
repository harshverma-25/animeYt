'use client';
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Compass } from 'lucide-react';
import AnimeCard from '@/components/AnimeCard';
import { searchAnime } from '@/data/anime';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const results = searchAnime(query);

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Search Header Glass Card */}
      <div className="glass rounded-[36px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[18px] bg-[#D81B60] flex items-center justify-center text-white shadow-lg">
            <Search strokeWidth={1.8} className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[26px] sm:text-[30px] font-extrabold text-white tracking-tight">
              {query ? `Search Results for "${query}"` : 'Search Catalogue'}
            </h1>
            <p className="text-[14px] text-white/65 mt-0.5">
              Showing matching officially streamed YouTube titles and episodes.
            </p>
          </div>
        </div>

        <div className="glass-chip px-4 py-2 rounded-full text-[14px] font-semibold text-[#FF8FB4] self-start md:self-auto">
          {results.length} Matches Found
        </div>
      </div>

      {/* Results Grid or Empty State */}
      {results.length > 0 ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          
        >
          {results.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-[36px] p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white/50 mb-4">
            <Search strokeWidth={1.8} className="w-8 h-8" />
          </div>
          <h2 className="text-[22px] font-bold text-white mb-2">No Anime Found</h2>
          <p className="text-[14px] text-white/65 mb-6 leading-relaxed max-w-md">
            We couldn\'t find any anime matching &quot;{query}&quot;. Try searching for &quot;Demon Slayer&quot;, &quot;Jujutsu Kaisen&quot;, &quot;Action&quot; or browse the full catalogue.
          </p>
          <Link
            href="/explore"
            className="btn-primary gap-2 text-[14px]"
          >
            <Compass strokeWidth={1.8} className="w-4 h-4" />
            <span>Browse Full Catalogue</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="glass rounded-[36px] p-8 text-center text-white/60">Searching anime...</div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
