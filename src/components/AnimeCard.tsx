'use client';
import React from 'react';
import Link from 'next/link';
import { AnimeItem, getAnimeBySlug } from '@/data/anime';
import AnimePoster from './AnimePoster';
import LanguageTag from './LanguageTag';

interface AnimeCardProps {
  anime: AnimeItem | any;
  priority?: boolean;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const fullAnime: AnimeItem =
    'themeGradient' in anime
      ? (anime as AnimeItem)
      : getAnimeBySlug(anime.slug) || {
          id: anime.id || anime.slug,
          slug: anime.slug,
          title: anime.title,
          synopsis: anime.synopsis || '',
          releaseYear: anime.releaseYear || 2024,
          status: anime.status || 'Ongoing',
          genres: anime.genres || ['Action'],
          rating: '8.5',
          languages: anime.availableAudioLanguages || anime.languages || ['Japanese'],
          totalEpisodes: anime.totalEpisodes || 12,
          themeGradient: {
            from: '#8B1E3F',
            to: '#1A0B2E',
            orbColor: '#FF5A7A',
          },
          versions: [],
        };

  const firstEpisode = fullAnime.versions?.[0]?.episodes?.[0];
  const watchHref = firstEpisode
    ? `/watch/${fullAnime.slug}/${firstEpisode.id}`
    : `/anime/${fullAnime.slug}`;

  return (
    <Link
      href={watchHref}
      className="glass anime-card-hover group flex flex-col rounded-[26px] p-2 sm:p-2.5 text-left cursor-pointer relative overflow-hidden h-full justify-between"
      aria-label={`Watch ${fullAnime.title}`}
    >
      <div>
        {/* Compact Aspect 16/10 Poster */}
        <AnimePoster
          title={fullAnime.title}
          episodeCount={fullAnime.totalEpisodes}
          themeGradient={fullAnime.themeGradient}
          thumbnailUrl={
            firstEpisode
              ? `https://img.youtube.com/vi/${firstEpisode.youtubeVideoId}/hqdefault.jpg`
              : fullAnime.poster || undefined
          }
        />

        {/* Info Section */}
        <div className="pt-2.5 pb-1 px-1">
          {/* Title: 2 lines with min-h to keep all cards in row perfectly aligned */}
          <h3
            className="text-[14px] sm:text-[14.5px] font-semibold text-white leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-[#FF8FB4] transition-colors"
            title={fullAnime.title}
          >
            {fullAnime.title}
          </h3>

          <p className="text-[11.5px] text-white/60 mt-1 truncate font-medium">
            {fullAnime.releaseYear} • {fullAnime.genres.join(', ')}
          </p>
        </div>
      </div>

      {/* Language tags at bottom */}
      <div className="flex flex-wrap items-center gap-1 mt-2 px-1 pb-1">
        {fullAnime.languages.map((lang: string) => (
          <LanguageTag key={lang} language={lang} className="text-[10px] px-2 py-0.5" />
        ))}
      </div>
    </Link>
  );
}
