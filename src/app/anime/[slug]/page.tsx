'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import {
  Play,
  Bookmark,
  Check,
  Sparkles,
  ExternalLink,
  Clock,
  Film,
  ShieldCheck,
} from 'lucide-react';
import { getAnimeBySlug, ANIME_LIST } from '@/data/anime';
import AnimePoster from '@/components/AnimePoster';
import AnimeCard from '@/components/AnimeCard';
import LanguageTag from '@/components/LanguageTag';

export default function AnimeDetailsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const anime = getAnimeBySlug(slug);

  const [isSaved, setIsSaved] = useState(false);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  if (!anime) {
    return (
      <div className="glass rounded-[36px] p-12 text-center max-w-lg mx-auto my-12">
        <h1 className="text-2xl font-bold mb-3 text-white">Anime Not Found</h1>
        <p className="text-white/60 mb-6">The anime title you are looking for does not exist in our YouTube catalogue.</p>
        <Link href="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  const currentVersion = anime.versions[selectedVersionIndex] || anime.versions[0];
  const firstEpisode = currentVersion?.episodes?.[0];
  const episodes = currentVersion?.episodes || [];

  // More like this: anime with matching genre or status
  const moreLikeThis = ANIME_LIST.filter(
    (a) => a.id !== anime.id && a.genres.some((g) => anime.genres.includes(g))
  ).slice(0, 5);

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Large Glass Banner */}
      <div className="glass-large rounded-[44px] p-6 sm:p-9 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-7 lg:gap-10">
        {/* Key Art / Poster Left (Aspect 3/4, rounded 28px) */}
        <div className="w-full sm:w-[240px] lg:w-[280px] shrink-0">
          <AnimePoster
            title={anime.title}
            episodeCount={anime.totalEpisodes}
            themeGradient={anime.themeGradient}
            thumbnailUrl={firstEpisode ? `https://img.youtube.com/vi/${firstEpisode.youtubeVideoId}/hqdefault.jpg` : undefined}
            aspect="aspect-[3/4]"
            className="rounded-[28px] shadow-2xl border border-white/20"
          />
        </div>

        {/* Details Right */}
        <div className="flex-1 flex flex-col justify-between h-full min-w-0 w-full">
          <div>
            {/* Badges row */}
            <div className="flex items-center gap-2.5 mb-3 flex-wrap">
              <span className="glass-chip inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold text-[#FF8FB4] border border-[#FF8FB4]/30">
                <ShieldCheck strokeWidth={1.8} className="w-3.5 h-3.5 text-[#FF8FB4]" />
                Official YouTube Stream
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium text-white/70 bg-white/10">
                {anime.status}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold text-[#FFD447] bg-[#FFD447]/10">
                ★ {anime.rating}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-[32px] sm:text-[42px] lg:text-[48px] font-extrabold text-white tracking-tight leading-tight mb-2">
              {anime.title}
            </h1>
            {anime.originalTitle && (
              <p className="text-[16px] text-white/50 mb-3 font-medium">
                {anime.originalTitle}
              </p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-2 text-[14px] text-white/70 font-medium mb-4 flex-wrap">
              <span>{anime.releaseYear}</span>
              <span>•</span>
              <span>{anime.genres.join(', ')}</span>
              <span>•</span>
              <span>{anime.totalEpisodes} Episodes</span>
            </div>

            {/* Languages available */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <span className="text-[12px] font-bold text-white/50 uppercase tracking-wider mr-1">
                AVAILABLE DUBS:
              </span>
              {anime.languages.map((lang) => (
                <LanguageTag key={lang} language={lang} />
              ))}
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex items-center gap-3.5 flex-wrap pt-2">
            {firstEpisode && (
              <Link
                href={`/watch/${anime.slug}/${firstEpisode.id}`}
                className="btn-primary gap-2.5 text-[15px] px-8"
              >
                <Play strokeWidth={2} className="w-5 h-5 fill-white" />
                <span>Watch on YouTube</span>
              </Link>
            )}

            <button
              onClick={() => setIsSaved(!isSaved)}
              className="btn-secondary gap-2 text-[15px] px-6"
              aria-label="Add to Watchlist"
            >
              {isSaved ? (
                <>
                  <Check strokeWidth={1.8} className="w-5 h-5 text-[#FF8FB4]" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Bookmark strokeWidth={1.8} className="w-5 h-5" />
                  <span>Add to Watchlist</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Synopsis Panel */}
      <div className="glass rounded-[32px] p-6 sm:p-8">
        <h2 className="text-[20px] font-bold text-white mb-3">Synopsis</h2>
        <p className="text-[15px] text-white/75 leading-relaxed font-normal">
          {anime.synopsis}
        </p>

        {/* Channel License Attribution */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-4 flex-wrap text-[13px] text-white/60">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white/80">Official License Partner:</span>
            <span className="text-[#FF8FB4] font-medium">{currentVersion.channelName}</span>
          </div>
          <a
            href={currentVersion.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#FF8FB4] hover:text-white transition-colors"
          >
            <span>Visit Official Channel</span>
            <ExternalLink strokeWidth={1.8} className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Episode List as Glass Rows */}
      <div className="glass rounded-[36px] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-[22px] font-bold text-white">Episodes</h2>
            <p className="text-[13px] text-white/60">
              Streaming directly through official YouTube player embeds.
            </p>
          </div>

          {/* Audio Dub Selector if multiple versions exist */}
          {anime.versions.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-white/50 uppercase">AUDIO:</span>
              <div className="glass-chip rounded-full p-1 flex items-center gap-1">
                {anime.versions.map((ver, idx) => (
                  <button
                    key={ver.id}
                    onClick={() => setSelectedVersionIndex(idx)}
                    className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                      selectedVersionIndex === idx
                        ? 'bg-[#D81B60] text-white'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {ver.audioLanguage}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Episode Glass Rows */}
        <div className="flex flex-col gap-3">
          {episodes.map((ep) => (
            <Link
              key={ep.id}
              href={`/watch/${anime.slug}/${ep.id}`}
              className="glass rounded-[24px] p-3 sm:p-4 flex items-center justify-between gap-4 hover:bg-white/[0.12] transition-all group"
            >
              {/* Thumbnail + info */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative w-[110px] sm:w-[130px] aspect-video rounded-[16px] overflow-hidden shrink-0 bg-[#160B24] border border-white/15">
                  <img
                    src={`https://img.youtube.com/vi/${ep.youtubeVideoId}/hqdefault.jpg`}
                    alt={ep.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play strokeWidth={2} className="w-6 h-6 text-white fill-white" />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[12px] font-bold text-[#FF8FB4]">
                      EP {ep.episodeNumber}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      {ep.audioLanguage}
                    </span>
                  </div>
                  <h3 className="text-[15px] sm:text-[16px] font-semibold text-white truncate group-hover:text-[#FF8FB4] transition-colors">
                    {ep.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[12px] text-white/50 mt-1">
                    <Clock strokeWidth={1.8} className="w-3.5 h-3.5" />
                    <span>{ep.duration}</span>
                    <span>•</span>
                    <span>{ep.channelName}</span>
                  </div>
                </div>
              </div>

              {/* 44px Round Glass Play Button */}
              <div className="w-11 h-11 rounded-full glass flex items-center justify-center text-white/80 shrink-0 group-hover:bg-[#D81B60] group-hover:text-white transition-all shadow-md">
                <Play strokeWidth={2} className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* More Like This */}
      {moreLikeThis.length > 0 && (
        <div className="w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-[14px] glass flex items-center justify-center text-[#FF8FB4]">
              <Film strokeWidth={1.8} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-white">More Like This</h2>
              <p className="text-[13px] text-white/60">Similar titles officially available on YouTube</p>
            </div>
          </div>
          <div
            className="grid gap-[18px]"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))',
            }}
          >
            {moreLikeThis.map((item) => (
              <AnimeCard key={item.id} anime={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
