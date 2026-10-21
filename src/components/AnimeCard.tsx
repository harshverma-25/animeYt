'use client';
import React from 'react';
import Link from 'next/link';
import AnimePoster from './AnimePoster';
import LanguageTag from './LanguageTag';

interface AnimeCardProps {
  anime: any;
  priority?: boolean;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const title = anime.title || 'Untitled Anime';
  const slug = anime.slug || '';
  const releaseYear = anime.releaseYear || '';
  const genres = Array.isArray(anime.genres) ? anime.genres : [];
  const languages = anime.availableAudioLanguages || anime.languages || [];
  const verifiedEpisodes = anime.verifiedEpisodeCount ?? anime.totalEpisodes ?? 0;

  // Real poster from MongoDB or YouTube thumbnail fallback
  const posterUrl = anime.poster || anime.thumbnail || undefined;

  // If anime has verified episodes, first episode link or details link
  const firstEpisodeId = anime.versions?.[0]?.episodes?.[0]?.id || anime.versions?.[0]?.episodes?.[0]?.youtubeVideoId;
  const href = verifiedEpisodes > 0 && firstEpisodeId
    ? `/watch/${slug}/${firstEpisodeId}`
    : `/anime/${slug}`;

  return (
    <Link
      href={href}
      className="glass anime-card-hover group flex flex-col rounded-[26px] p-2 sm:p-2.5 text-left cursor-pointer relative overflow-hidden h-full justify-between"
      aria-label={`View ${title}`}
    >
      <div>
        {/* Compact Aspect 16/10 Poster */}
        <AnimePoster
          title={title}
          episodeCount={verifiedEpisodes > 0 ? verifiedEpisodes : undefined}
          badge={verifiedEpisodes > 0 ? `${verifiedEpisodes} EPS` : undefined}
          thumbnailUrl={posterUrl}
        />

        {/* Info Section */}
        <div className="pt-2.5 pb-1 px-1">
          {/* Title: 2 lines with min-h to keep all cards in row aligned */}
          <h3
            className="text-[14px] sm:text-[14.5px] font-semibold text-white leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-[#FF8FB4] transition-colors"
            title={title}
          >
            {title}
          </h3>

          <p className="text-[11.5px] text-white/60 mt-1 truncate font-medium">
            {releaseYear ? `${releaseYear} • ` : ''}{genres.slice(0, 3).join(', ')}
          </p>
        </div>
      </div>

      {/* Language tags at bottom */}
      <div className="flex flex-wrap items-center gap-1 mt-2 px-1 pb-1">
        {languages.length > 0 ? (
          languages.map((lang: string) => (
            <LanguageTag key={lang} language={lang} className="text-[10px] px-2 py-0.5" />
          ))
        ) : (
          <span className="text-[10.5px] text-white/40 italic">Catalogue Title</span>
        )}
      </div>
    </Link>
  );
}
