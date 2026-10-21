'use client';

import Link from 'next/link';
import { IAnime } from '@/types/anime';
import { Play } from 'lucide-react';

interface AnimeCardProps {
  anime: IAnime & {
    availableAudioLanguages?: string[];
    totalEpisodes?: number;
  };
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const languages = anime.availableAudioLanguages || ['Japanese'];

  return (
    <Link
      href={`/anime/${anime.slug}`}
      className="group flex flex-col bg-[#16161F]/90 rounded-2xl border border-[#282835] overflow-hidden hover:border-[#FF3D69]/60 hover:shadow-xl hover:shadow-[#FF3D69]/5 transition-all duration-200"
    >
      {/* 2:3 Portrait Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#111117]">
        <img
          src={anime.poster}
          alt={anime.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Hover overlay with Play button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-[#FF3D69] text-white flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Episode Count Badge */}
        {typeof anime.totalEpisodes === 'number' && anime.totalEpisodes > 0 && (
          <span className="absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded bg-black/85 text-[#F5F5F7] border border-white/10 backdrop-blur-sm font-mono">
            {anime.totalEpisodes} EPS
          </span>
        )}
      </div>

      {/* Info Content */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-[#F5F5F7] truncate group-hover:text-[#FF3D69] transition-colors">
            {anime.title}
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-[#A1A1B0] mt-0.5 truncate">
            <span>{anime.releaseYear}</span>
            <span>•</span>
            <span className="truncate">{anime.genres.slice(0, 2).join(', ')}</span>
          </div>
        </div>

        {/* Audio Badges (Matching Screenshot) */}
        <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-[#262633]/80">
          {languages.map((lang) => {
            const isHindi = lang.toLowerCase() === 'hindi';
            return (
              <span
                key={lang}
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                  isHindi
                    ? 'bg-[#FF3D69]/15 text-[#FF5A81] border-[#FF3D69]/40 font-semibold'
                    : 'bg-[#202029] text-[#A1A1B0] border-[#2D2D3A]'
                }`}
              >
                {lang}
              </span>
            );
          })}
        </div>
      </div>
    </Link>
  );
}
