'use client';
import React, { useState } from 'react';

interface AnimePosterProps {
  title: string;
  episodeCount?: number;
  themeGradient?: any;
  thumbnailUrl?: string;
  aspect?: string;
  className?: string;
  badge?: string;
}

export default function AnimePoster({
  title,
  episodeCount,
  thumbnailUrl,
  aspect = 'aspect-[3/4]',
  className = '',
  badge,
}: AnimePosterProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] ${aspect} ${className} select-none bg-[#140F22] border border-white/[0.08]`}
    >
      {/* Dark poster fallback art */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1E1730] to-[#0E0A17] pointer-events-none flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-white/30 text-xs font-semibold">
          {title.slice(0, 2).toUpperCase()}
        </div>
      </div>

      {/* Actual YouTube thumbnail */}
      {thumbnailUrl && !imageError && (
        <img
          src={thumbnailUrl}
          alt={title}
          onError={() => setImageError(true)}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      )}

      {/* Dark gradient overlay on bottom for high text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0714] via-[#0A0714]/30 to-transparent pointer-events-none" />

      {/* Glass chip badge: "N EPS" or custom badge */}
      {(episodeCount !== undefined || badge) && (
        <div className="absolute bottom-2.5 left-2.5 z-10">
          <span className="glass-chip inline-flex items-center px-2.5 py-1 text-[11px] font-bold tracking-wider text-white rounded-full">
            {badge || `${episodeCount} EPS`}
          </span>
        </div>
      )}
    </div>
  );
}
