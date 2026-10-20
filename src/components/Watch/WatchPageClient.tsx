'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimeWithDetails, IEpisode, IAnimeVersion } from '@/types/anime';
import YouTubePlayer from '@/components/Player/YouTubePlayer';
import LanguageSelector from '@/components/Player/LanguageSelector';
import EpisodeList from '@/components/Player/EpisodeList';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ListVideo,
} from 'lucide-react';

interface WatchPageClientProps {
  anime: AnimeWithDetails;
  initialEpisode: IEpisode;
  initialVersion: IAnimeVersion & { episodes: IEpisode[] };
}

export default function WatchPageClient({
  anime,
  initialEpisode,
  initialVersion,
}: WatchPageClientProps) {
  const router = useRouter();

  const [currentVersion, setCurrentVersion] = useState<
    IAnimeVersion & { episodes: IEpisode[] }
  >(initialVersion);
  const [currentEpisode, setCurrentEpisode] = useState<IEpisode>(initialEpisode);

  // Valid versions with verified episodes
  const validVersions = anime.versions.filter(
    (v) => v.verificationStatus === 'verified' && v.episodes.length > 0
  );

  // Compute previous and next episodes within current version
  const sortedEpisodes = [...currentVersion.episodes].sort(
    (a, b) =>
      a.seasonNumber !== b.seasonNumber
        ? a.seasonNumber - b.seasonNumber
        : a.episodeNumber - b.episodeNumber
  );

  const currentIndex = sortedEpisodes.findIndex(
    (ep) => (ep.id || ep._id) === (currentEpisode.id || currentEpisode._id)
  );

  const prevEpisode = currentIndex > 0 ? sortedEpisodes[currentIndex - 1] : null;
  const nextEpisode =
    currentIndex >= 0 && currentIndex < sortedEpisodes.length - 1
      ? sortedEpisodes[currentIndex + 1]
      : null;

  // Language switch handler: keep same episode number if exists in new version
  const handleSelectVersion = (versionId: string) => {
    const newVer = validVersions.find((v) => (v.id || v._id) === versionId);
    if (!newVer) return;

    setCurrentVersion(newVer);
    // Find matching episode number
    const matchingEp =
      newVer.episodes.find(
        (ep) =>
          ep.episodeNumber === currentEpisode.episodeNumber &&
          ep.seasonNumber === currentEpisode.seasonNumber
      ) || newVer.episodes[0];

    if (matchingEp) {
      setCurrentEpisode(matchingEp);
      router.push(`/watch/${anime.slug}/${matchingEp.id || matchingEp._id}`);
    }
  };

  const handleSelectEpisode = (ep: IEpisode) => {
    setCurrentEpisode(ep);
    router.push(`/watch/${anime.slug}/${ep.id || ep._id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Breadcrumb / Return */}
      <div className="flex items-center justify-between">
        <Link
          href={`/anime/${anime.slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-[#A2A2B2] hover:text-[#F4F4F7] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {anime.title} Details</span>
        </Link>

        <span className="text-xs text-[#A2A2B2] font-medium hidden sm:inline">
          {currentVersion.audioLanguage} Dub • {currentVersion.channelName}
        </span>
      </div>

      {/* Main Watch Layout: Player on Left/Center, Episode Sidebar on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Player & Episode Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* YouTube Embedded Player */}
          <YouTubePlayer
            videoId={currentEpisode.youtubeVideoId}
            title={`${anime.title} - Season ${currentEpisode.seasonNumber} Episode ${currentEpisode.episodeNumber}`}
            channelName={currentVersion.channelName}
          />

          {/* Episode Controls & Nav Bar */}
          <div className="p-4 rounded-xl bg-[#191920] border border-[#30303A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#FF3D69]">
                  S{currentEpisode.seasonNumber} : EP {currentEpisode.episodeNumber}
                </span>
                <span className="text-xs text-[#A2A2B2]">•</span>
                <span className="text-xs font-semibold text-[#F4F4F7]">
                  {anime.title}
                </span>
              </div>
              <h1 className="text-base font-bold text-[#F4F4F7]">
                {currentEpisode.title}
              </h1>
            </div>

            {/* Previous / Next Episode Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => prevEpisode && handleSelectEpisode(prevEpisode)}
                disabled={!prevEpisode}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#202028] border border-[#30303A] text-[#F4F4F7] hover:bg-[#282834] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev EP</span>
              </button>

              <button
                onClick={() => nextEpisode && handleSelectEpisode(nextEpisode)}
                disabled={!nextEpisode}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FF3D69] text-white hover:bg-[#FF5A81] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                <span>Next EP</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Audio Language Version Switcher */}
          {validVersions.length > 1 && (
            <div className="p-4 rounded-xl bg-[#191920] border border-[#30303A]">
              <LanguageSelector
                versions={validVersions}
                selectedVersionId={currentVersion.id || currentVersion._id || ''}
                onSelectVersion={handleSelectVersion}
              />
            </div>
          )}
        </div>

        {/* Right Column: Episode Playlist Sidebar */}
        <div className="p-4 rounded-xl bg-[#191920] border border-[#30303A] space-y-3">
          <div className="flex items-center justify-between border-b border-[#30303A] pb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#F4F4F7]">
              <ListVideo className="w-4 h-4 text-[#FF3D69]" />
              <span>Episodes</span>
            </div>
            <span className="text-xs text-[#A2A2B2]">
              {sortedEpisodes.length} Episodes
            </span>
          </div>

          {/* Episode List in current version */}
          <EpisodeList
            animeSlug={anime.slug}
            episodes={currentVersion.episodes}
            currentEpisodeId={currentEpisode.id || currentEpisode._id}
          />
        </div>
      </div>
    </div>
  );
}
