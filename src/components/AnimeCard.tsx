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
  // If passed an IAnime or partial, merge with rich mock data if found
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
      className="glass anime-card-hover group flex flex-col rounded-[32px] p-2.5 text-left cursor-pointer relative overflow-hidden"
      aria-label={`Watch ${fullAnime.title.includes(':') ? fullAnime.title.split(':')[0] : fullAnime.title}`}
    >
      {/* 3/4 Poster with 24px radius & glass chip */}
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
      <div className="pt-3 pb-1 px-1 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-white leading-tight line-clamp-1 group-hover:text-[#FF8FB4] transition-colors">
            {fullAnime.title}
          </h3>
          <p className="text-[12.5px] text-white/70 mt-1 line-clamp-1 font-medium">
            {fullAnime.releaseYear} • {fullAnime.genres.join(', ')}
          </p>
        </div>

        {/* Language tags */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          {fullAnime.languages.map((lang: string) => (
            <LanguageTag key={lang} language={lang} />
          ))}
        </div>
      </div>
    </Link>
  );
}
