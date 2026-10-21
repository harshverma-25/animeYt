'use client';
import React, { useState } from 'react';

interface AnimePosterProps {
  title: string;
  episodeCount?: number;
  themeGradient?: {
    from: string;
    via?: string;
    to: string;
    orbColor: string;
  };
  thumbnailUrl?: string;
  aspect?: string;
  className?: string;
  badge?: string;
}

export default function AnimePoster({
  title,
  episodeCount,
  themeGradient,
  thumbnailUrl,
  aspect = 'aspect-[3/4]',
  className = '',
  badge,
}: AnimePosterProps) {
  const [imageError, setImageError] = useState(false);

  const gradientFrom = themeGradient?.from || '#4A122E';
  const gradientTo = themeGradient?.to || '#0D0820';
  const orbColor = themeGradient?.orbColor || '#FF8FB4';

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] ${aspect} ${className} select-none`}
      style={{
        background: `linear-gradient(175deg, ${gradientFrom} 0%, ${themeGradient?.via || '#1A0B2E'} 50%, ${gradientTo} 100%)`,
      }}
    >
      {/* Visual landscape & glowing orb silhouette fallback art */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft glowing sun/moon circle as shown in the reference image */}
        <div
          className="absolute rounded-full"
          style={{
            width: '42%',
            height: '42%',
            top: '26%',
            right: '18%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(255,240,245,0.75) 50%, rgba(255,255,255,0) 80%)',
            boxShadow: `0 0 45px 12px ${orbColor}66`,
          }}
        />

        {/* Mountain silhouette curves */}
        <svg
          viewBox="0 0 200 260"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full opacity-40 mix-blend-multiply"
        >
          <path
            d="M -10 260 L 50 170 L 110 220 L 170 150 L 220 260 Z"
            fill="#080313"
          />
          <path
            d="M -20 260 L 40 200 L 90 235 L 150 185 L 220 260 Z"
            fill="#05010B"
            opacity="0.8"
          />
        </svg>

        {/* Star dust micro-dots */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.8)_1px,transparent_1px),radial-gradient(circle_at_75%_35%,rgba(255,255,255,0.8)_1.5px,transparent_1.5px),radial-gradient(circle_at_40%_60%,rgba(255,255,255,0.6)_1px,transparent_1px)] bg-[length:100px_100px]" />
      </div>

      {/* Actual YouTube thumbnail if available and not erroring */}
      {thumbnailUrl && !imageError && (
        <img
          src={thumbnailUrl}
          alt={title}
          onError={() => setImageError(true)}
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80 transition-opacity duration-300"
          loading="lazy"
        />
      )}

      {/* Dark gradient overlay on bottom for high text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0517]/90 via-[#0A0517]/20 to-transparent pointer-events-none" />

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
