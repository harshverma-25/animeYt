'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Play,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Clock,
  Share2,
  Check,
  AlertTriangle,
  Bookmark,
} from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';

export default function WatchEpisodePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const episodeParam = (params?.episode || (params as any)?.episodeId) as string;

  const [anime, setAnime] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    fetch(`/api/catalogue/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setAnime(data);
        setLoading(false);
      })
      .catch(() => {
        setAnime(null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="glass rounded-[36px] p-12 text-center text-white/60 my-12">
        Loading episode player...
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="glass rounded-[36px] p-12 text-center max-w-lg mx-auto my-12">
        <h1 className="text-2xl font-bold mb-3 text-white">Anime Not Found</h1>
        <p className="text-white/60 mb-6">Could not find the anime requested.</p>
        <Link href="/" className="btn-primary">Back to Home</Link>
      </div>
    );
  }

  // Find all verified episodes across versions
  const allVersions = anime.versions || [];
  const allEpisodes: any[] = allVersions.flatMap((v: any) => v.episodes || []);

  // Find active verified episode
  const activeEpisode =
    allEpisodes.find(
      (ep: any) =>
        ep.id === episodeParam ||
        ep.youtubeVideoId === episodeParam ||
        String(ep.episodeNumber) === episodeParam
    ) || allEpisodes[0];

  const currentVersion =
    allVersions.find((v: any) =>
      v.episodes?.some((e: any) => e.youtubeVideoId === activeEpisode?.youtubeVideoId)
    ) || allVersions[0];

  const versionEpisodes: any[] = currentVersion?.episodes || [];
  const currentIndex = versionEpisodes.findIndex(
    (e: any) => e.youtubeVideoId === activeEpisode?.youtubeVideoId
  );
  const prevEp = currentIndex > 0 ? versionEpisodes[currentIndex - 1] : null;
  const nextEp = currentIndex >= 0 && currentIndex < versionEpisodes.length - 1 ? versionEpisodes[currentIndex + 1] : null;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // If no verified episodes exist for this anime, do NOT play fake videos!
  if (!activeEpisode) {
    return (
      <div className="glass rounded-[36px] p-12 text-center max-w-lg mx-auto my-12 flex flex-col items-center">
        <AlertTriangle strokeWidth={1.8} className="w-10 h-10 text-[#FF8FB4] mb-3" />
        <h1 className="text-2xl font-bold mb-2 text-white">No Verified Episodes Available</h1>
        <p className="text-white/60 mb-6 text-sm leading-relaxed">
          {anime.title} has no officially verified YouTube streams published at this time. We never stream unauthorized or unverified sources.
        </p>
        <Link href={`/anime/${anime.slug}`} className="btn-primary text-sm px-6">
          View Anime Overview
        </Link>
      </div>
    );
  }

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
          <span className="text-[#FF8FB4] font-medium">Episode {activeEpisode.episodeNumber}</span>
        </div>

        <div className="flex items-center gap-2.5">
          {anime && (() => {
            const isSaved = isInWatchlist(anime._id?.toString() || anime.id, anime.slug);
            return (
              <button
                onClick={() => {
                  const animeId = anime._id?.toString() || anime.id || anime.slug;
                  toggleWatchlist(animeId, anime.slug);
                }}
                className={`glass-chip inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                  isSaved ? 'text-[#FF8FB4] border-[#FF8FB4]/50 bg-[#D81B60]/20' : 'text-white/80 hover:text-white'
                }`}
                aria-label={isSaved ? 'In Watchlist' : 'Add to Watchlist'}
              >
                {isSaved ? (
                  <>
                    <Check strokeWidth={2} className="w-3.5 h-3.5 text-[#FF8FB4]" />
                    <span>In Watchlist</span>
                  </>
                ) : (
                  <>
                    <Bookmark strokeWidth={1.8} className="w-3.5 h-3.5" />
                    <span>Add to Watchlist</span>
                  </>
                )}
              </button>
            );
          })()}

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

      {/* Main Player Row */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        {/* Left Column: Embed + Info */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-5">
          {/* Big Rounded 36px Glass Frame around official YouTube Embed */}
          <div className="glass-large rounded-[36px] p-3 sm:p-4.5 overflow-hidden shadow-2xl border border-white/20">
            <div className="relative w-full aspect-video rounded-[28px] overflow-hidden bg-black shadow-inner">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeEpisode.youtubeVideoId}?rel=0&autoplay=1&modestbranding=1`}
                title={activeEpisode.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          </div>

          {/* Player Controls & Info Bar */}
          <div className="glass rounded-[32px] p-6 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[12px] font-bold text-[#FF8FB4] px-2.5 py-0.5 rounded-full bg-[#D81B60]/20">
                    EPISODE {activeEpisode.episodeNumber}
                  </span>
                  {currentVersion?.audioLanguage && (
                    <span className="text-[12px] text-white/70 px-2.5 py-0.5 rounded-full bg-white/10">
                      {currentVersion.audioLanguage} Audio
                    </span>
                  )}
                  {activeEpisode.duration && (
                    <span className="text-[12px] text-white/50 flex items-center gap-1">
                      <Clock strokeWidth={1.8} className="w-3 h-3" />
                      {activeEpisode.duration}
                    </span>
                  )}
                </div>
                <h1 className="text-[24px] sm:text-[28px] font-extrabold text-white tracking-tight leading-snug">
                  {activeEpisode.title}
                </h1>
                <p className="text-[14px] text-white/60 font-medium">
                  {anime.title}
                </p>
              </div>

              {/* Prev / Next Episode Buttons */}
              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                {prevEp ? (
                  <Link
                    href={`/watch/${anime.slug}/${prevEp.id || prevEp.youtubeVideoId}`}
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
                    href={`/watch/${anime.slug}/${nextEp.id || nextEp.youtubeVideoId}`}
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

            {/* Language Switcher & Source Attribution */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  AUDIO TRACKS:
                </span>
                {allVersions.map((ver: any) => {
                  const targetEp = ver.episodes?.[0];
                  const isActive = currentVersion?.audioLanguage === ver.audioLanguage;
                  return targetEp ? (
                    <Link
                      key={ver.id || ver.audioLanguage}
                      href={`/watch/${anime.slug}/${targetEp.id || targetEp.youtubeVideoId}`}
                      className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                        isActive
                          ? 'bg-[#D81B60] text-white shadow-md'
                          : 'glass-chip text-white/70 hover:text-white hover:bg-white/15'
                      }`}
                    >
                      {ver.audioLanguage}
                    </Link>
                  ) : null;
                })}
              </div>

              {/* Source Channel Attribution Link */}
              <div className="flex items-center gap-2 text-[12.5px] text-white/60">
                <ShieldCheck strokeWidth={1.8} className="w-4 h-4 text-[#FF8FB4]" />
                <span>Source:</span>
                <span className="font-semibold text-[#FF8FB4]">
                  {activeEpisode.sourceChannelName || currentVersion?.channelName || 'Official Channel'}
                </span>
                <a
                  href={`https://www.youtube.com/watch?v=${activeEpisode.youtubeVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#FF8FB4] hover:text-white inline-flex items-center gap-1 transition-colors underline ml-1"
                >
                  YouTube
                  <ExternalLink strokeWidth={1.8} className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Up Next Glass Sidebar List */}
        <div className="w-full xl:w-[380px] shrink-0 glass rounded-[36px] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-[17px] font-bold text-white">Up Next & Episodes</h2>
            <span className="text-[12px] font-semibold text-[#FF8FB4]">
              {allEpisodes.length} Verified
            </span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[640px] overflow-y-auto pr-1">
            {allEpisodes.map((ep: any) => {
              const isCurrent = ep.youtubeVideoId === activeEpisode.youtubeVideoId;
              return (
                <Link
                  key={ep.id || ep.youtubeVideoId}
                  href={`/watch/${anime.slug}/${ep.id || ep.youtubeVideoId}`}
                  className={`flex items-center gap-3 p-2.5 rounded-[20px] transition-all group ${
                    isCurrent
                      ? 'bg-white/20 border border-white/30 text-white shadow-md'
                      : 'hover:bg-white/10 text-white/70'
                  }`}
                >
                  <div className="relative w-[86px] aspect-video rounded-[12px] overflow-hidden bg-[#1A0B2E] shrink-0 border border-white/10">
                    <img
                      src={ep.thumbnail || `https://img.youtube.com/vi/${ep.youtubeVideoId}/hqdefault.jpg`}
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
                    </div>
                    <h3 className="text-[13.5px] font-semibold text-white truncate group-hover:text-[#FF8FB4] transition-colors mt-0.5">
                      {ep.title}
                    </h3>
                    <p className="text-[11px] text-white/50">{ep.duration || '24:00'}</p>
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
