'use client';
import React from 'react';
import Link from 'next/link';
import { Play, TrendingUp } from 'lucide-react';
import { AnimeItem } from '@/data/anime';
import AnimePoster from './AnimePoster';

interface TrendingPanelProps {
  trendingAnime: AnimeItem[];
}

export default function TrendingPanel({ trendingAnime }: TrendingPanelProps) {
  // Top 3 rows
  const displayItems = trendingAnime.slice(0, 3);

  return (
    <div className="glass-large rounded-[44px] p-6 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#D81B60]/20 flex items-center justify-center text-[#FF8FB4]">
            <TrendingUp strokeWidth={1.8} className="w-5 h-5" />
          </div>
          <h2 className="text-[19px] font-bold text-white tracking-tight">
            Trending Now
          </h2>
        </div>
        <span className="text-[12px] font-semibold text-[#FF8FB4] uppercase tracking-wider">
          Top 3
        </span>
      </div>

      {/* 3 Rows */}
      <div className="flex flex-col gap-3.5 flex-1 justify-around">
        {displayItems.map((anime, index) => {
          const firstEp = anime.versions?.[0]?.episodes?.[0];
          const watchHref = firstEp ? `/watch/${anime.slug}/${firstEp.id}` : `/anime/${anime.slug}`;

          return (
            <Link
              key={anime.id}
              href={watchHref}
              className="group flex items-center gap-3.5 p-2 rounded-[24px] hover:bg-white/[0.08] transition-all"
              aria-label={`Watch ${anime.title.includes(':') ? anime.title.split(':')[0] : anime.title}`}
            >
              {/* 58x76 thumbnail with rounded-2xl */}
              <div className="w-[58px] h-[76px] shrink-0">
                <AnimePoster
                  title={anime.title}
                  themeGradient={anime.themeGradient}
                  thumbnailUrl={firstEp ? `https://img.youtube.com/vi/${firstEp.youtubeVideoId}/hqdefault.jpg` : undefined}
                  aspect="h-full w-full"
                  className="rounded-[18px]"
                />
              </div>

              {/* Title & Meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#FF8FB4]">
                    #{index + 1}
                  </span>
                  <h3 className="text-[15px] font-semibold text-white truncate group-hover:text-[#FF8FB4] transition-colors">
                    {anime.title}
                  </h3>
                </div>
                <p className="text-[12px] text-white/60 truncate mt-0.5">
                  {anime.releaseYear} • {anime.genres.join(', ')}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                    {anime.languages.join(' / ')}
                  </span>
                </div>
              </div>

              {/* 46px round play button */}
              <div className="w-[46px] h-[46px] rounded-full glass flex items-center justify-center text-white/80 shrink-0 group-hover:bg-[#D81B60] group-hover:text-white transition-all shadow-md">
                <Play strokeWidth={2} className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
