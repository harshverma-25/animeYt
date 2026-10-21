'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Play,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Clock,
  Share2,
  Check,
} from 'lucide-react';
import { getAnimeBySlug } from '@/data/anime';
import LanguageTag from '@/components/LanguageTag';

export default function WatchEpisodePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const episodeParam = (params?.episodeId || params?.episode) as string;

  const [copied, setCopied] = useState(false);

  const anime = getAnimeBySlug(slug);

  if (!anime) {
    return (
      <div className="glass rounded-[36px] p-12 text-center max-w-lg mx-auto my-12">
        <h1 className="text-2xl font-bold mb-3 text-white">Anime Not Found</h1>
        <p className="text-white/60 mb-6">Could not find the anime requested.</p>
        <Link href="/" className="btn-primary">Back to Home</Link>
      </div>
    );
  }

  // Find all episodes across versions
  const allEpisodes = anime.versions.flatMap((v) => v.episodes);

  // Find active episode: match by id or episode number or default to first
  const activeEpisode =
    allEpisodes.find((ep) => ep.id === episodeParam || String(ep.episodeNumber) === episodeParam) ||
    allEpisodes[0];

  const currentVersion =
    anime.versions.find((v) =>
      v.episodes.some((e) => e.id === activeEpisode?.id)
    ) || anime.versions[0];

  const currentIndex = allEpisodes.findIndex((e) => e.id === activeEpisode?.id);
  const prevEp = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
  const nextEp = currentIndex < allEpisodes.length - 1 ? allEpisodes[currentIndex + 1] : null;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-7 w-full">
      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-[13px] text-white/60">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
          <span>/</span>
          <Link href={`/anime/${anime.slug}`} className="hover:text-white transition-colors">
            {anime.title}
          </Link>
          <span>/</span>
          <span className="text-[#FF8FB4] font-medium">Episode {activeEpisode?.episodeNumber}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyLink}
            className="glass-chip inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold text-white/80 hover:text-white transition-all"
          >
            {copied ? (
              <>
                <Check strokeWidth={1.8} className="w-3.5 h-3.5 text-[#FF8FB4]" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Share2 strokeWidth={1.8} className="w-3.5 h-3.5 text-[#FF8FB4]" />
                <span>Share Episode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Player Row: 36px rounded glass frame around embed + Up Next Sidebar */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        {/* Left Column: Embed + Info */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-5">
          {/* Big Rounded 36px Glass Frame around official YouTube Embed */}
          <div className="glass-large rounded-[36px] p-3 sm:p-4.5 overflow-hidden shadow-2xl border border-white/20">
            <div className="relative w-full aspect-video rounded-[28px] overflow-hidden bg-black shadow-inner">
              {activeEpisode ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeEpisode.youtubeVideoId}?rel=0&autoplay=1&modestbranding=1`}
                  title={activeEpisode.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white/50">
                  Video stream unavailable.
                </div>
              )}
            </div>
          </div>

          {/* Player Controls & Info Bar */}
          <div className="glass rounded-[32px] p-6 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[12px] font-bold text-[#FF8FB4] px-2.5 py-0.5 rounded-full bg-[#D81B60]/20">
                    EPISODE {activeEpisode?.episodeNumber}
                  </span>
                  <span className="text-[12px] text-white/70 px-2.5 py-0.5 rounded-full bg-white/10">
                    {activeEpisode?.audioLanguage} Audio
                  </span>
                  <span className="text-[12px] text-white/50 flex items-center gap-1">
                    <Clock strokeWidth={1.8} className="w-3 h-3" />
                    {activeEpisode?.duration}
                  </span>
                </div>
                <h1 className="text-[24px] sm:text-[28px] font-extrabold text-white tracking-tight leading-snug">
                  {activeEpisode?.title}
                </h1>
                <p className="text-[14px] text-white/60 font-medium">
                  {anime.title}
                </p>
              </div>

              {/* Prev / Next Episode Buttons */}
              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                {prevEp ? (
                  <Link
                    href={`/watch/${anime.slug}/${prevEp.id}`}
                    className="glass px-4 py-2.5 rounded-full text-[13px] font-semibold text-white/80 hover:text-white flex items-center gap-1.5 transition-all"
                  >
                    <ChevronLeft strokeWidth={1.8} className="w-4 h-4" />
                    <span>Previous</span>
                  </Link>
                ) : (
                  <button
                    disabled
                    className="opacity-40 glass px-4 py-2.5 rounded-full text-[13px] font-semibold text-white/40 flex items-center gap-1.5 cursor-not-allowed"
                  >
                    <ChevronLeft strokeWidth={1.8} className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                )}

                {nextEp ? (
                  <Link
                    href={`/watch/${anime.slug}/${nextEp.id}`}
                    className="btn-primary px-5 py-2.5 h-[42px] text-[13px] font-semibold flex items-center gap-1.5"
                  >
                    <span>Next</span>
                    <ChevronRight strokeWidth={1.8} className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="opacity-40 glass px-4 py-2.5 rounded-full text-[13px] font-semibold text-white/40 flex items-center gap-1.5 cursor-not-allowed"
                  >
                    <span>Next</span>
                    <ChevronRight strokeWidth={1.8} className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Language Switcher Pills */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  AUDIO TRACKS:
                </span>
                {anime.versions.map((ver) => {
                  const targetEp = ver.episodes[0];
                  const isActive = activeEpisode?.audioLanguage === ver.audioLanguage;
                  return (
                    <Link
                      key={ver.id}
                      href={targetEp ? `/watch/${anime.slug}/${targetEp.id}` : '#'}
                      className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                        isActive
                          ? 'bg-[#D81B60] text-white shadow-md'
                          : 'glass-chip text-white/70 hover:text-white hover:bg-white/15'
                      }`}
                    >
                      {ver.audioLanguage}
                    </Link>
                  );
                })}
              </div>

              {/* Source Channel Attribution Link */}
              <div className="flex items-center gap-2 text-[12.5px] text-white/60">
                <ShieldCheck strokeWidth={1.8} className="w-4 h-4 text-[#FF8FB4]" />
                <span>Source:</span>
                <a
                  href={currentVersion.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#FF8FB4] hover:text-white inline-flex items-center gap-1 transition-colors underline"
                >
                  {currentVersion.channelName}
                  <ExternalLink strokeWidth={1.8} className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: "Up next" Glass Sidebar List */}
        <div className="w-full xl:w-[380px] shrink-0 glass rounded-[36px] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-[17px] font-bold text-white">Up Next & Episodes</h2>
            <span className="text-[12px] font-semibold text-[#FF8FB4]">
              {allEpisodes.length} Episodes
            </span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[640px] overflow-y-auto pr-1">
            {allEpisodes.map((ep, idx) => {
              const isCurrent = ep.id === activeEpisode?.id;
              return (
                <Link
                  key={ep.id}
                  href={`/watch/${anime.slug}/${ep.id}`}
                  className={`flex items-center gap-3 p-2.5 rounded-[20px] transition-all group ${
                    isCurrent
                      ? 'bg-white/20 border border-white/30 text-white shadow-md'
                      : 'hover:bg-white/10 text-white/70'
                  }`}
                >
                  <div className="relative w-[86px] aspect-video rounded-[12px] overflow-hidden bg-[#1A0B2E] shrink-0 border border-white/10">
                    <img
                      src={`https://img.youtube.com/vi/${ep.youtubeVideoId}/hqdefault.jpg`}
                      alt={ep.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play strokeWidth={2} className={`w-3.5 h-3.5 fill-current ${isCurrent ? 'text-[#FF8FB4]' : 'text-white'}`} />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-[#FF8FB4]">
                        EP {ep.episodeNumber}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white/60">
                        {ep.audioLanguage}
                      </span>
                    </div>
                    <h3 className="text-[13.5px] font-semibold text-white truncate group-hover:text-[#FF8FB4] transition-colors mt-0.5">
                      {ep.title}
                    </h3>
                    <p className="text-[11px] text-white/50">{ep.duration}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
