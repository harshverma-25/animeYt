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
  const languages = anime.availableAudioLanguages || [];

  return (
    <Link
      href={`/anime/${anime.slug}`}
      className="group flex flex-col bg-[#191920] rounded-xl border border-[#30303A] overflow-hidden hover:border-[#FF3D69]/60 hover:shadow-md hover:shadow-[#FF3D69]/5 transition-all duration-200"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#15151C]">
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

        {/* Total verified episodes badge */}
        {typeof anime.totalEpisodes === 'number' && anime.totalEpisodes > 0 && (
          <span className="absolute bottom-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/75 text-[#F4F4F7] border border-white/10 backdrop-blur-sm">
            {anime.totalEpisodes} {anime.totalEpisodes === 1 ? 'EP' : 'EPS'}
          </span>
        )}

        {/* Featured pill if applicable */}
        {anime.isFeatured && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#FF3D69] text-white">
            Featured
          </span>
        )}
      </div>

      {/* Anime Info */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          <h3 className="text-xs font-semibold text-[#F4F4F7] line-clamp-1 group-hover:text-[#FF3D69] transition-colors">
            {anime.title}
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-[#A2A2B2] mt-0.5">
            <span>{anime.releaseYear}</span>
            <span>•</span>
            <span className="line-clamp-1">{anime.genres.slice(0, 2).join(', ')}</span>
          </div>
        </div>

        {/* Audio Badges */}
        {languages.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-[#30303A]/60">
            {languages.map((lang) => (
              <span
                key={lang}
                className={`text-[9px] font-medium px-1.5 py-0.2 rounded border ${
                  lang.toLowerCase() === 'hindi'
                    ? 'bg-[#FF3D69]/10 text-[#FF5A81] border-[#FF3D69]/30'
                    : 'bg-[#202028] text-[#A2A2B2] border-[#30303A]'
                }`}
              >
                {lang}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
