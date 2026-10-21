'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface HeroProps {
  featuredAnime: any[];
}

export default function Hero({ featuredAnime }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const anime = featuredAnime[currentIndex] || featuredAnime[0];

  useEffect(() => {
    if (isPaused || featuredAnime.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredAnime.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, featuredAnime.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredAnime.length) % featuredAnime.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredAnime.length);
  };

  if (!anime) return null;

  const firstEp = anime.versions?.[0]?.episodes?.[0];
  const verifiedCount = anime.verifiedEpisodeCount ?? anime.totalEpisodes ?? 0;
  const watchHref = firstEp ? `/watch/${anime.slug}/${firstEp.id || firstEp.youtubeVideoId}` : `/anime/${anime.slug}`;
  const languages = anime.availableAudioLanguages || anime.languages || ['Hindi'];
  const posterUrl = anime.backdrop || anime.poster || (firstEp ? `https://img.youtube.com/vi/${firstEp.youtubeVideoId}/hqdefault.jpg` : undefined);

  return (
    <div
      className="glass-large rounded-[36px] p-5 sm:p-7 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 min-h-[300px] lg:min-h-[320px] transition-colors"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Left Column: Details & CTA */}
      <div className="flex-1 flex flex-col justify-between h-full z-10 w-full min-w-0">
        <div>
          {/* Pill headers */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#D81B60]/25 text-[#FFC2D6] border border-[#FF8FB4]/40">
              <Sparkles strokeWidth={1.8} className="w-3 h-3 text-[#FF8FB4]" />
              FEATURED ANIME
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white/70 bg-white/10 border border-white/15">
              Official YouTube Stream
            </span>
          </div>

          {/* Compact Title */}
          <h1 className="text-[28px] sm:text-[36px] lg:text-[44px] font-extrabold text-white tracking-[-1px] leading-[1.05] mb-2 max-w-xl line-clamp-2">
            {anime.title}
          </h1>

          {/* Description */}
          <p className="text-[13px] sm:text-[14px] text-white/70 line-clamp-2 mb-3 max-w-xl leading-relaxed">
            {anime.synopsis}
          </p>

          {/* Meta info */}
          <div className="text-[12px] font-medium text-white/60 mb-4 flex items-center gap-2 flex-wrap">
            <span>{anime.releaseYear}</span>
            <span>•</span>
            <span>{anime.genres?.join(', ')}</span>
            <span>•</span>
            <span className="text-[#FFC2D6] font-semibold">
              {languages.length > 0 ? languages.join(' & ') : 'Official'} Audio
            </span>
          </div>
        </div>

        {/* Buttons and Carousel Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          {/* Action buttons (responsive on mobile) */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {verifiedCount > 0 ? (
              <Link
                href={watchHref}
                className="btn-primary gap-2 text-[14px] px-5 sm:px-6 h-[44px] sm:h-[46px] flex-1 sm:flex-initial justify-center"
                aria-label={`Watch ${anime.title}`}
              >
                <Play strokeWidth={2} className="w-4 h-4 fill-white" />
                <span>Watch</span>
              </Link>
            ) : (
              <Link
                href={`/anime/${anime.slug}`}
                className="btn-primary gap-2 text-[14px] px-5 sm:px-6 h-[44px] sm:h-[46px] flex-1 sm:flex-initial justify-center"
              >
                <span>View Details</span>
              </Link>
            )}

            <Link
              href={`/anime/${anime.slug}`}
              className="btn-secondary text-[14px] px-4 sm:px-5 h-[44px] sm:h-[46px] flex-1 sm:flex-initial justify-center text-center"
              aria-label={`View details for ${anime.title}`}
            >
              <span>Explore Info</span>
            </Link>
          </div>

          {/* Carousel dots & navigation buttons */}
          {featuredAnime.length > 1 && (
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {featuredAnime.map((item, idx) => (
                  <button
                    key={item.id || item.slug || idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`rounded-full transition-all duration-300 ${
                      idx === currentIndex
                        ? 'w-[28px] h-[6px] bg-[#D81B60]'
                        : 'w-[6px] h-[6px] bg-white/20 hover:bg-white/40'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Prev/Next 38px round glass buttons */}
              <div className="flex items-center gap-1.5 ml-1">
                <button
                  onClick={handlePrev}
                  className="w-[38px] h-[38px] rounded-full glass flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-all"
                  aria-label="Previous Featured Anime"
                >
                  <ChevronLeft strokeWidth={1.8} className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="w-[38px] h-[38px] rounded-full glass flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-all"
                  aria-label="Next Featured Anime"
                >
                  <ChevronRight strokeWidth={1.8} className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: 28px rounded Key Art Card */}
      <div className="w-full sm:w-[260px] md:w-[280px] lg:w-[320px] shrink-0">
        <div className="relative rounded-[28px] aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden shadow-xl border border-white/15 select-none group bg-[#120E1E]">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={anime.title}
              width={640}
              height={400}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1E1630] to-[#0D0916] flex items-center justify-center text-white/20 text-3xl font-bold">
              {anime.title.slice(0, 2).toUpperCase()}
            </div>
          )}

          {/* Dark cinematic vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0714] via-transparent to-[#0A0714]/30 pointer-events-none" />

          {/* Top-Left Glass Chip: Language */}
          <div className="absolute top-3 left-3 z-10">
            <span className="glass-chip inline-flex items-center px-2.5 py-1 text-[11px] font-semibold text-white rounded-full">
              {languages[0] || 'Official'} Audio
            </span>
          </div>

          {/* Bottom-Right Glass Chip: Episodes */}
          {verifiedCount > 0 && (
            <div className="absolute bottom-3 right-3 z-10">
              <span className="glass-chip inline-flex items-center px-2.5 py-1 text-[11px] font-bold tracking-wider text-white rounded-full">
                {verifiedCount} EPS
              </span>
            </div>
          )}

          {/* Bottom-Left 48px Glass Play Button */}
          {verifiedCount > 0 && (
            <Link
              href={watchHref}
              className="absolute bottom-3 left-3 z-10 w-[48px] h-[48px] rounded-full glass flex items-center justify-center text-white shadow-xl hover:scale-110 hover:bg-[#D81B60] transition-all group-hover:bg-[#D81B60]"
              aria-label={`Play ${anime.title}`}
            >
              <Play strokeWidth={2} className="w-5 h-5 fill-white ml-0.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
