'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Play,
  Bookmark,
  Check,
  ExternalLink,
  Clock,
  Film,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import AnimePoster from '@/components/AnimePoster';
import AnimeCard from '@/components/AnimeCard';
import LanguageTag from '@/components/LanguageTag';
import { useWatchlist } from '@/hooks/useWatchlist';
import { getCachedAnime, fetchAnimeWithCache } from '@/lib/client/animeCache';

export default function AnimeDetailsPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  const [anime, setAnime] = useState<any>(() => getCachedAnime(slug));
  const [loading, setLoading] = useState<boolean>(() => !getCachedAnime(slug));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [moreLikeThis, setMoreLikeThis] = useState<any[]>([]);

  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    if (!slug) return;

    const cached = getCachedAnime(slug);
    if (cached) {
      setAnime(cached);
      setLoading(false);
      const firstGenre = cached.genres?.[0] || 'Action';
      fetch(`/api/catalogue?genre=${firstGenre}&limit=6`)
        .then((r) => r.json())
        .then((rec) => {
          setMoreLikeThis((rec.items || []).filter((item: any) => item.slug !== slug).slice(0, 5));
        })
        .catch(() => {});
      return;
    }

    setLoading(true);
    fetchAnimeWithCache(slug)
      .then((data) => {
        setAnime(data);
        setLoading(false);

        // Fetch recommendations from same genre
        const firstGenre = data.genres?.[0] || 'Action';
        fetch(`/api/catalogue?genre=${firstGenre}&limit=6`)
          .then((r) => r.json())
          .then((rec) => {
            setMoreLikeThis((rec.items || []).filter((item: any) => item.slug !== slug).slice(0, 5));
          })
          .catch(() => {});
      })
      .catch(() => {
        setAnime(null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="glass rounded-[36px] p-12 text-center text-white/60 my-12">
        Loading anime details...
      </div>
    );
  }

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

  const versions = anime.versions || [];
  const currentVersion = versions[selectedVersionIndex] || versions[0];
  const episodes = currentVersion?.episodes || [];
  const firstEpisode = episodes[0];
  const totalVerifiedEpisodes = anime.verifiedEpisodeCount ?? anime.totalEpisodes ?? 0;

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Large Glass Banner */}
      <div className="glass-large rounded-[44px] p-6 sm:p-9 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-7 lg:gap-10">
        {/* Key Art / Poster Left */}
        <div className="w-full sm:w-[240px] lg:w-[280px] shrink-0">
          <AnimePoster
            title={anime.title}
            episodeCount={totalVerifiedEpisodes > 0 ? totalVerifiedEpisodes : undefined}
            badge={totalVerifiedEpisodes > 0 ? `${totalVerifiedEpisodes} EPS` : undefined}
            thumbnailUrl={anime.poster || undefined}
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
                {anime.status || 'Completed'}
              </span>
              {anime.rating && anime.rating !== 'N/A' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold text-[#FFD447] bg-[#FFD447]/10">
                  ★ {anime.rating}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-[32px] sm:text-[42px] lg:text-[48px] font-extrabold text-white tracking-tight leading-tight mb-2">
              {anime.title}
            </h1>
            {(anime.nativeTitle || anime.romajiTitle) && (
              <p className="text-[16px] text-white/50 mb-3 font-medium">
                {anime.nativeTitle || anime.romajiTitle}
              </p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-2 text-[14px] text-white/70 font-medium mb-4 flex-wrap">
              <span>{anime.releaseYear}</span>
              <span>•</span>
              <span>{anime.genres?.join(', ')}</span>
              <span>•</span>
              <span>
                {totalVerifiedEpisodes > 0 ? `${totalVerifiedEpisodes} Verified Episodes` : 'Discovery Entry'}
              </span>
            </div>

            {/* Languages available */}
            {anime.availableAudioLanguages && anime.availableAudioLanguages.length > 0 && (
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <span className="text-[12px] font-bold text-white/50 uppercase tracking-wider mr-1">
                  AVAILABLE DUBS:
                </span>
                {anime.availableAudioLanguages.map((lang: string) => (
                  <LanguageTag key={lang} language={lang} />
                ))}
              </div>
            )}
          </div>

          {/* Action CTA Buttons */}
          <div className="flex items-center gap-3.5 flex-wrap pt-2">
            {firstEpisode ? (
              <Link
                href={`/watch/${anime.slug}/${firstEpisode.id || firstEpisode.youtubeVideoId}`}
                className="btn-primary gap-2.5 text-[15px] px-8"
              >
                <Play strokeWidth={2} className="w-5 h-5 fill-white" />
                <span>Watch on YouTube</span>
              </Link>
            ) : (
              <div className="glass-chip inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] text-white/60">
                <AlertCircle strokeWidth={1.8} className="w-4 h-4 text-[#FF8FB4]" />
                <span>Episodes not available yet</span>
              </div>
            )}

            {(() => {
              const isSaved = anime ? isInWatchlist(anime._id?.toString() || anime.id, anime.slug) : false;
              return (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (!anime) return;
                      const animeId = anime._id?.toString() || anime.id || anime.slug;
                      const added = toggleWatchlist(animeId, anime.slug);
                      setFeedback(added ? 'Added to your Watchlist' : 'Removed from your Watchlist');
                      setTimeout(() => setFeedback(null), 3000);
                    }}
                    className={`btn-secondary gap-2 text-[15px] px-6 transition-all ${
                      isSaved ? 'border-[#FF8FB4]/50 bg-white/10' : ''
                    }`}
                    aria-label={isSaved ? 'In Watchlist' : 'Add to Watchlist'}
                  >
                    {isSaved ? (
                      <>
                        <Check strokeWidth={2} className="w-5 h-5 text-[#FF8FB4]" />
                        <span className="text-white font-semibold">In Watchlist</span>
                      </>
                    ) : (
                      <>
                        <Bookmark strokeWidth={1.8} className="w-5 h-5" />
                        <span>Add to Watchlist</span>
                      </>
                    )}
                  </button>
                  {feedback && (
                    <span className="text-[13px] font-medium text-[#FF8FB4] bg-[#D81B60]/20 border border-[#D81B60]/30 px-3 py-1.5 rounded-full transition-all animate-in fade-in">
                      {feedback}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Synopsis Panel */}
      <div className="glass rounded-[32px] p-6 sm:p-8">
        <h2 className="text-[20px] font-bold text-white mb-3">Synopsis</h2>
        <p className="text-[15px] text-white/75 leading-relaxed font-normal">
          {anime.synopsis || 'No synopsis provided for this title.'}
        </p>

        {/* Channel License Attribution */}
        {currentVersion && (
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-4 flex-wrap text-[13px] text-white/60">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white/80">Official License Partner:</span>
              <span className="text-[#FF8FB4] font-medium">{currentVersion.channelName}</span>
            </div>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#FF8FB4] hover:text-white transition-colors"
            >
              <span>Verified Source Embed</span>
              <ExternalLink strokeWidth={1.8} className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Episode List as Glass Rows */}
      <div className="glass rounded-[36px] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-[22px] font-bold text-white">Episodes</h2>
            <p className="text-[13px] text-white/60">
              Only officially verified YouTube embeds are listed here.
            </p>
          </div>

          {/* Audio Dub Selector */}
          {versions.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-white/50 uppercase">AUDIO:</span>
              <div className="glass-chip rounded-full p-1 flex items-center gap-1">
                {versions.map((ver: any, idx: number) => (
                  <button
                    key={ver.id || ver.audioLanguage}
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

        {/* Episode Rows or Clean Unverified State */}
        {episodes.length > 0 ? (
          <div className="flex flex-col gap-3">
            {episodes.map((ep: any) => (
              <Link
                key={ep.id || ep.youtubeVideoId}
                href={`/watch/${anime.slug}/${ep.id || ep.youtubeVideoId}`}
                className="glass rounded-[24px] p-3 sm:p-4 flex items-center justify-between gap-4 hover:bg-white/[0.12] transition-all group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-[110px] sm:w-[130px] aspect-video rounded-[16px] overflow-hidden shrink-0 bg-[#160B24] border border-white/15">
                    <img
                      src={ep.thumbnail || `https://img.youtube.com/vi/${ep.youtubeVideoId}/hqdefault.jpg`}
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
                        {currentVersion.audioLanguage}
                      </span>
                    </div>
                    <h3 className="text-[15px] sm:text-[16px] font-semibold text-white truncate group-hover:text-[#FF8FB4] transition-colors">
                      {ep.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[12px] text-white/50 mt-1">
                      <Clock strokeWidth={1.8} className="w-3.5 h-3.5" />
                      <span>{ep.duration || '24:00'}</span>
                      <span>•</span>
                      <span>{ep.sourceChannelName || currentVersion.channelName}</span>
                    </div>
                  </div>
                </div>

                <div className="w-11 h-11 rounded-full glass flex items-center justify-center text-white/80 shrink-0 group-hover:bg-[#D81B60] group-hover:text-white transition-all shadow-md">
                  <Play strokeWidth={2} className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-chip rounded-[24px] p-8 text-center flex flex-col items-center justify-center">
            <AlertCircle strokeWidth={1.8} className="w-8 h-8 text-[#FF8FB4] mb-2" />
            <h3 className="text-[17px] font-bold text-white mb-1">No Verified Episodes Available</h3>
            <p className="text-[13.5px] text-white/60 max-w-md leading-relaxed mb-4">
              We only display officially authorized YouTube episodes. This anime is catalogued for discovery while official streams are pending verification.
            </p>
            <Link href="/explore" className="btn-secondary text-[13px] px-5 py-2">
              Explore Available Anime
            </Link>
          </div>
        )}
      </div>

      {/* More Like This (5 columns in a row) */}
      {moreLikeThis.length > 0 && (
        <div className="w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-[14px] glass flex items-center justify-center text-[#FF8FB4]">
              <Film strokeWidth={1.8} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-white">More Like This</h2>
              <p className="text-[13px] text-white/60">Similar titles from our catalogue</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {moreLikeThis.map((item) => (
              <AnimeCard key={item.id || item.slug} anime={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
