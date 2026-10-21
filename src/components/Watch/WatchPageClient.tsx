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

  const validVersions = anime.versions.filter(
    (v) => v.verificationStatus === 'verified' && v.episodes.length > 0
  );

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

  const handleSelectVersion = (versionId: string) => {
    const newVer = validVersions.find((v) => (v.id || v._id) === versionId);
    if (!newVer) return;

    setCurrentVersion(newVer);
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
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/anime/${anime.slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-[#A1A1B0] hover:text-[#F5F5F7] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {anime.title} Details</span>
        </Link>

        <span className="text-xs text-[#A1A1B0] font-medium hidden sm:inline">
          {currentVersion.audioLanguage} Dub • {currentVersion.channelName}
        </span>
      </div>

      {/* Main Watch Grid: 16:9 Player on Left, Playlist on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Player & Meta */}
        <div className="lg:col-span-2 space-y-4">
          <YouTubePlayer
            videoId={currentEpisode.youtubeVideoId}
            title={`${anime.title} - Season ${currentEpisode.seasonNumber} Episode ${currentEpisode.episodeNumber}`}
            channelName={currentVersion.channelName}
          />

          {/* Episode Info & Next/Prev Controls */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#16161F]/90 border border-[#282835] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#FF3D69]">
                  S{currentEpisode.seasonNumber} : EP {currentEpisode.episodeNumber}
                </span>
                <span className="text-xs text-[#A1A1B0]">•</span>
                <span className="text-xs font-semibold text-[#F5F5F7]">
                  {anime.title}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-[#F5F5F7]">
                {currentEpisode.title}
              </h1>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => prevEpisode && handleSelectEpisode(prevEpisode)}
                disabled={!prevEpisode}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#202029] border border-[#30303B] text-[#F5F5F7] hover:bg-[#282835] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev EP</span>
              </button>

              <button
                onClick={() => nextEpisode && handleSelectEpisode(nextEpisode)}
                disabled={!nextEpisode}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-[#FF3D69] text-white hover:bg-[#FF5A81] disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#FF3D69]/20 transition-colors"
              >
                <span>Next EP</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Audio Dub Switcher */}
          {validVersions.length > 1 && (
            <div className="p-4 rounded-2xl bg-[#16161F]/90 border border-[#282835]">
              <LanguageSelector
                versions={validVersions}
                selectedVersionId={currentVersion.id || currentVersion._id || ''}
                onSelectVersion={handleSelectVersion}
              />
            </div>
          )}
        </div>

        {/* Right Column: Playlist Sidebar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#16161F]/90 border border-[#282835] space-y-3">
          <div className="flex items-center justify-between border-b border-[#22222E] pb-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#F5F5F7]">
              <ListVideo className="w-4 h-4 text-[#FF3D69]" />
              <span>Episodes</span>
            </div>
            <span className="text-xs text-[#A1A1B0]">
              {sortedEpisodes.length} Episodes
            </span>
          </div>

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
