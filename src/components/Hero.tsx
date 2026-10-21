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
      className="glass-large rounded-[44px] p-5 sm:p-7 relative overflow-hidden flex flex-col lg:flex-row items-center gap-6 lg:gap-8 min-h-[460px] transition-all"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Left Column: Details & CTA */}
      <div className="flex-1 flex flex-col justify-between h-full z-10 w-full">
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
          <h1 className="text-[38px] sm:text-[52px] lg:text-[68px] font-extrabold text-white tracking-[-2px] leading-[0.98] mb-3 max-w-md">
            {anime.title.includes(':') ? anime.title.split(':')[0] : anime.title}
          </h1>

          {/* Description */}
          <p className="text-[14px] sm:text-[15px] text-white/75 line-clamp-3 mb-4 max-w-xl leading-relaxed">
            {anime.synopsis}
          </p>

          {/* Meta info */}
          <div className="text-[13px] font-medium text-white/65 mb-6 flex items-center gap-2">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={watchHref}
              className="btn-primary gap-2.5 text-[15px]"
              aria-label={`Watch ${anime.title} on YouTube`}
            >
              <Play strokeWidth={2} className="w-5 h-5 fill-white" />
              <span>Watch on YouTube</span>
            </Link>

            <Link
              href={`/anime/${anime.slug}`}
              className="btn-secondary text-[15px]"
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
                      : 'w-[8px] h-[8px] bg-white/25 hover:bg-white/45'
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
      <div className="w-full lg:w-[360px] xl:w-[410px] shrink-0">
        <div
          className="relative rounded-[34px] aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] w-full overflow-hidden shadow-2xl border border-white/20 select-none group"
          style={{
            background: `linear-gradient(175deg, ${anime.themeGradient?.from || '#8B1E3F'} 0%, ${anime.themeGradient?.via || '#4A122E'} 55%, ${anime.themeGradient?.to || '#1A0B2E'} 100%)`,
          }}
        >
          {/* Key Art Glowing Sun & Silhouette as seen in reference image */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Glowing moon/sun */}
            <div
              className="absolute rounded-full"
              style={{
                width: '160px',
                height: '160px',
                top: '28%',
                right: '18%',
                background: 'radial-gradient(circle, #FFF6F0 0%, #FFDFCF 45%, rgba(255,200,180,0.1) 75%, transparent 100%)',
                boxShadow: `0 0 70px 20px ${anime.themeGradient?.orbColor || '#FF5A7A'}88`,
              }}
            />

            {/* Mountains silhouette */}
            <svg
              viewBox="0 0 300 400"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full mix-blend-multiply opacity-55"
            >
              <path
                d="M -10 400 L 70 250 L 150 330 L 230 220 L 320 400 Z"
                fill="#0F061C"
              />
              <path
                d="M -20 400 L 60 290 L 140 350 L 220 270 L 320 400 Z"
                fill="#080210"
                opacity="0.9"
              />
            </svg>

            {/* Sparkle micro-dots */}
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_15%_15%,#FFF_1.5px,transparent_1.5px),radial-gradient(circle_at_80%_25%,#FFF_2px,transparent_2px),radial-gradient(circle_at_45%_55%,#FFF_1.5px,transparent_1.5px)] bg-[length:120px_120px]" />
          </div>

          {/* YouTube HQ Thumbnail Blend */}
          {firstEp && (
            <img
              src={`https://img.youtube.com/vi/${firstEp.youtubeVideoId}/hqdefault.jpg`}
              alt={anime.title}
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 group-hover:scale-105 transition-transform duration-700"
            />
          )}

          {/* Dark bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0517]/90 via-transparent to-[#0A0517]/30 pointer-events-none" />

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
            className="absolute bottom-4 left-4 z-10 w-[60px] h-[60px] rounded-full glass flex items-center justify-center text-white shadow-xl hover:scale-110 hover:bg-[#D81B60] transition-all group-hover:bg-[#D81B60]/90"
            aria-label={`Play ${anime.title}`}
          >
            <Play strokeWidth={2} className="w-6 h-6 fill-white ml-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
