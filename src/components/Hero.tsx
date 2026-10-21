'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { AnimeItem } from '@/data/anime';

interface HeroProps {
  featuredAnime: AnimeItem[];
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
  const watchHref = firstEp ? `/watch/${anime.slug}/${firstEp.id}` : `/anime/${anime.slug}`;

  return (
    <div
      className="glass-large rounded-[44px] p-6 sm:p-9 lg:p-10 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 min-h-[440px] transition-all"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Left Column: Details & CTA */}
      <div className="flex-1 flex flex-col justify-between h-full z-10 w-full min-w-0">
        <div>
          {/* Pill headers */}
          <div className="flex items-center gap-2.5 mb-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[12px] font-bold bg-[#D81B60]/25 text-[#FFC2D6] border border-[#FF8FB4]/40">
              <Sparkles strokeWidth={1.8} className="w-3.5 h-3.5 text-[#FF8FB4]" />
              FEATURED ANIME
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium text-white/70 bg-white/10 border border-white/15">
              Official YouTube Stream
            </span>
          </div>

          {/* Title */}
          <h1 className="text-[38px] sm:text-[54px] lg:text-[66px] font-extrabold text-white tracking-[-2px] leading-[0.98] mb-3 max-w-2xl">
            {anime.title.includes(':') ? anime.title.split(':')[0] : anime.title}
          </h1>

          {/* Description */}
          <p className="text-[14.5px] sm:text-[15.5px] text-white/75 line-clamp-3 mb-4 max-w-2xl leading-relaxed">
            {anime.synopsis}
          </p>

          {/* Meta info */}
          <div className="text-[13.5px] font-medium text-white/65 mb-6 flex items-center gap-2 flex-wrap">
            <span>{anime.releaseYear}</span>
            <span>•</span>
            <span>{anime.genres.join(', ')}</span>
            <span>•</span>
            <span className="text-[#FFC2D6] font-semibold">
              {anime.languages.join(' & ')} Audio
            </span>
          </div>
        </div>

        {/* Buttons and Carousel Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pt-2">
          {/* Action buttons */}
          <div className="flex items-center gap-3.5 flex-wrap">
            <Link
              href={watchHref}
              className="btn-primary gap-2.5 text-[15px] px-8"
              aria-label={`Watch ${anime.title} on YouTube`}
            >
              <Play strokeWidth={2} className="w-5 h-5 fill-white" />
              <span>Watch on YouTube</span>
            </Link>

            <Link
              href={`/anime/${anime.slug}`}
              className="btn-secondary text-[15px] px-6"
              aria-label={`View details for ${anime.title}`}
            >
              <span>View Details</span>
            </Link>
          </div>

          {/* Carousel dots & navigation buttons */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Dots */}
            <div className="flex items-center gap-2">
              {featuredAnime.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-[34px] h-[8px] bg-[#D81B60]'
                      : 'w-[8px] h-[8px] bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Prev/Next 46px round glass buttons */}
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={handlePrev}
                className="w-[46px] h-[46px] rounded-full glass flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-all"
                aria-label="Previous Featured Anime"
              >
                <ChevronLeft strokeWidth={1.8} className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="w-[46px] h-[46px] rounded-full glass flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-all"
                aria-label="Next Featured Anime"
              >
                <ChevronRight strokeWidth={1.8} className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: 34px rounded Key Art Card */}
      <div className="w-full lg:w-[380px] xl:w-[440px] shrink-0">
        <div className="relative rounded-[34px] aspect-[4/5] sm:aspect-[16/11] lg:aspect-[4/5] w-full overflow-hidden shadow-2xl border border-white/15 select-none group bg-[#120E1E]">
          {/* YouTube HQ Thumbnail */}
          {firstEp ? (
            <img
              src={`https://img.youtube.com/vi/${firstEp.youtubeVideoId}/hqdefault.jpg`}
              alt={anime.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1E1630] to-[#0D0916]" />
          )}

          {/* Dark cinematic vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0714] via-[#0A0714]/20 to-[#0A0714]/40 pointer-events-none" />

          {/* Top-Left Glass Chip: Language */}
          <div className="absolute top-4 left-4 z-10">
            <span className="glass-chip inline-flex items-center px-3.5 py-1.5 text-[12px] font-semibold text-white rounded-full">
              {anime.languages[0]} Audio
            </span>
          </div>

          {/* Bottom-Right Glass Chip: Episodes */}
          <div className="absolute bottom-4 right-4 z-10">
            <span className="glass-chip inline-flex items-center px-3.5 py-1.5 text-[12px] font-bold tracking-wider text-white rounded-full">
              {anime.totalEpisodes} EPS
            </span>
          </div>

          {/* Bottom-Left 60px Glass Play Button */}
          <Link
            href={watchHref}
            className="absolute bottom-4 left-4 z-10 w-[60px] h-[60px] rounded-full glass flex items-center justify-center text-white shadow-xl hover:scale-110 hover:bg-[#D81B60] transition-all group-hover:bg-[#D81B60]"
            aria-label={`Play ${anime.title}`}
          >
            <Play strokeWidth={2} className="w-6 h-6 fill-white ml-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
