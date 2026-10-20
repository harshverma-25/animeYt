import Link from 'next/link';
import { IAnime } from '@/types/anime';
import { Play, Sparkles, CheckCircle } from 'lucide-react';

interface FeaturedStripProps {
  animeList: (IAnime & {
    availableAudioLanguages?: string[];
  })[];
}

export default function FeaturedStrip({ animeList }: FeaturedStripProps) {
  if (!animeList || animeList.length === 0) return null;

  const featured = animeList[0];

  return (
    <section className="w-full mb-8">
      <div className="relative rounded-2xl border border-[#30303A] bg-[#191920] overflow-hidden">
        {/* Subtle backdrop layer */}
        {featured.backdrop && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15 filter blur-sm"
            style={{ backgroundImage: `url(${featured.backdrop})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#191920] via-[#191920]/90 to-transparent" />

        <div className="relative p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Text / Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-[#FF3D69]/15 text-[#FF5A81] border border-[#FF3D69]/30">
                <Sparkles className="w-3 h-3" />
                Featured Anime Spotlight
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#A2A2B2]">
                <CheckCircle className="w-3 h-3 text-[#FF3D69]" />
                Official YouTube Stream
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[#F4F4F7] tracking-tight">
              {featured.title}
            </h2>

            <p className="text-xs sm:text-sm text-[#A2A2B2] line-clamp-2 max-w-2xl leading-relaxed">
              {featured.synopsis}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-[#A2A2B2] font-medium mr-1">
                {featured.releaseYear} • {featured.genres.join(', ')}
              </span>

              {featured.availableAudioLanguages &&
                featured.availableAudioLanguages.map((lang) => (
                  <span
                    key={lang}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#202028] text-[#F4F4F7] border border-[#30303A]"
                  >
                    {lang} Audio
                  </span>
                ))}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Link
                href={`/watch/${featured.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF3D69] hover:bg-[#FF5A81] text-white text-xs font-semibold shadow-md shadow-[#FF3D69]/10 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Watch Free on YouTube
              </Link>
              <Link
                href={`/anime/${featured.slug}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#202028] hover:bg-[#282834] text-[#F4F4F7] text-xs font-medium border border-[#30303A] transition-colors"
              >
                View Details & Episodes
              </Link>
            </div>
          </div>

          {/* Right Poster Thumbnail (Desktop) */}
          <div className="hidden md:block w-36 sm:w-44 shrink-0 aspect-[3/4] rounded-xl overflow-hidden border border-[#30303A] shadow-md">
            <img
              src={featured.poster}
              alt={featured.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
