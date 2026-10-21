import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Play,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Film,
} from 'lucide-react';
import AnimePoster from '@/components/AnimePoster';
import AnimeCard from '@/components/AnimeCard';
import LanguageTag from '@/components/LanguageTag';
import AnimeWatchlistButton from '@/components/AnimeWatchlistButton';
import AnimeEpisodesSection from '@/components/AnimeEpisodesSection';
import { CatalogueService } from '@/lib/services/catalogueService';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) return { title: 'Anime Details — AnimeYT' };

  const anime = await CatalogueService.getAnimeBySlug(slug);
  if (!anime) return { title: 'Anime Not Found — AnimeYT' };

  return {
    title: `${anime.title} — Watch Official Anime on YouTube | AnimeYT`,
    description: anime.synopsis
      ? anime.synopsis.slice(0, 160)
      : `Stream ${anime.title} legally on YouTube via verified distributor embeds on AnimeYT.`,
    openGraph: {
      title: `${anime.title} — AnimeYT`,
      description: anime.synopsis ? anime.synopsis.slice(0, 160) : undefined,
      images: anime.poster ? [{ url: anime.poster }] : undefined,
    },
  };
}

export default async function AnimeDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) {
    return (
      <div className="glass rounded-[36px] p-12 text-center max-w-lg mx-auto my-12">
        <h1 className="text-2xl font-bold mb-3 text-white">Anime Not Found</h1>
        <p className="text-white/60 mb-6">Invalid anime parameter provided.</p>
        <Link href="/" className="btn-primary">Back to Home</Link>
      </div>
    );
  }

  const anime = await CatalogueService.getAnimeBySlug(slug);

  if (!anime) {
    return (
      <div className="glass rounded-[36px] p-12 text-center max-w-lg mx-auto my-12">
        <h1 className="text-2xl font-bold mb-3 text-white">Anime Not Found</h1>
        <p className="text-white/60 mb-6">
          The anime title you are looking for does not exist in our YouTube catalogue.
        </p>
        <Link href="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  const primaryGenre = anime.genres?.[0];
  const moreLikeThisResult = await CatalogueService.getCatalogue({
    genre: primaryGenre,
    limit: 6,
  });
  const moreLikeThis = (moreLikeThisResult.items || [])
    .filter((item: any) => item.slug !== slug)
    .slice(0, 5);

  const versions = anime.versions || [];
  const totalVerifiedEpisodes = anime.verifiedEpisodeCount ?? anime.totalEpisodes ?? 0;
  const firstEpisode = versions[0]?.episodes?.[0];
  const currentVersion = versions[0];

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
            priority={true}
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
          <div className="flex items-center gap-3 sm:gap-3.5 flex-wrap pt-2 w-full sm:w-auto">
            {firstEpisode ? (
              <Link
                href={`/watch/${anime.slug}/${firstEpisode.id || firstEpisode.youtubeVideoId}`}
                className="btn-primary gap-2.5 text-[15px] px-7 sm:px-8 h-[46px] flex-1 sm:flex-initial justify-center"
              >
                <Play strokeWidth={2} className="w-5 h-5 fill-white" />
                <span>Watch</span>
              </Link>
            ) : (
              <div className="glass-chip inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] text-white/60">
                <AlertCircle strokeWidth={1.8} className="w-4 h-4 text-[#FF8FB4]" />
                <span>Episodes not available yet</span>
              </div>
            )}

            <AnimeWatchlistButton
              animeId={anime._id?.toString() || anime.id || anime.slug}
              slug={anime.slug}
              title={anime.title}
            />
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

      {/* Interactive Episode List with Language Dub Switching */}
      <AnimeEpisodesSection versions={versions} animeSlug={anime.slug} />

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
