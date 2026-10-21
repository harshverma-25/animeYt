'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IAnime } from '@/types/anime';
import { Play, ChevronLeft, ChevronRight, Video } from 'lucide-react';

interface FeaturedHeroProps {
  featuredList: (IAnime & {
    availableAudioLanguages?: string[];
  })[];
}

export default function FeaturedHero({ featuredList }: FeaturedHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!featuredList || featuredList.length === 0) return null;

  const current = featuredList[currentIndex] || featuredList[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : featuredList.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < featuredList.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="w-full relative rounded-2xl sm:rounded-3xl border border-[#2B2B38] bg-[#14141D] overflow-hidden shadow-2xl">
      {/* Background Graphic Layer */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#14141D] via-[#14141D]/90 to-transparent z-10" />

      {/* Right Anime Character Artwork */}
      <div className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 lg:w-1/2 overflow-hidden pointer-events-none">
        <img
          src={current.backdrop || current.poster}
          alt={current.title}
          className="w-full h-full object-cover object-center md:object-right filter brightness-90 contrast-105"
        />
        {/* Soft edge blending gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#14141D] via-transparent to-transparent md:hidden" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#14141D] via-[#14141D]/40 to-transparent hidden md:block" />
      </div>

      {/* Foreground Content */}
      <div className="relative z-20 p-6 sm:p-8 md:p-10 max-w-2xl flex flex-col justify-between min-h-[340px] sm:min-h-[380px]">
        {/* Top Badges */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#FF3D69]/15 text-[#FF5A81] border border-[#FF3D69]/30">
              <Video className="w-3 h-3" />
              FEATURED ANIME
            </span>
            <span className="text-[11px] text-[#A1A1B0] font-medium hidden sm:inline">
              Official YouTube Stream
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#F5F5F7] tracking-tight leading-tight">
            {current.title}
          </h1>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-[#A1A1B0] line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-xl">
            {current.synopsis}
          </p>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#A1A1B0] font-medium pt-1">
            <span>{current.releaseYear}</span>
            <span>•</span>
            <span>{current.genres.join(', ')}</span>
            <span>•</span>
            <span className="text-[#F5F5F7]">
              {current.availableAudioLanguages && current.availableAudioLanguages.length > 0
                ? `${current.availableAudioLanguages[0]} Audio`
                : 'Official Audio'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <Link
              href={`/watch/${current.slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF3D69] hover:bg-[#FF5A81] text-white text-xs sm:text-sm font-semibold shadow-lg shadow-[#FF3D69]/20 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Watch on YouTube</span>
            </Link>

            <Link
              href={`/anime/${current.slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#202029] hover:bg-[#282835] text-[#F5F5F7] text-xs sm:text-sm font-medium border border-[#30303B] transition-colors"
            >
              <span>View Details</span>
            </Link>
          </div>
        </div>

        {/* Bottom Slider Dots & Navigation Controls */}
        <div className="flex items-center justify-between pt-6 mt-auto">
          {/* Pagination Dots */}
          <div className="flex items-center gap-1.5">
            {featuredList.slice(0, 5).map((item, idx) => (
              <button
                key={item.id || item.slug}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  currentIndex === idx ? 'w-6 bg-[#FF3D69]' : 'w-1.5 bg-[#404050] hover:bg-[#606070]'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Circular Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-8 h-8 rounded-full bg-[#16161F]/90 border border-[#30303B] text-[#F5F5F7] flex items-center justify-center hover:bg-[#202029] hover:border-[#FF3D69]/40 transition-colors"
              aria-label="Previous featured anime"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="w-8 h-8 rounded-full bg-[#16161F]/90 border border-[#30303B] text-[#F5F5F7] flex items-center justify-center hover:bg-[#202029] hover:border-[#FF3D69]/40 transition-colors"
              aria-label="Next featured anime"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
