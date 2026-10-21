'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimeWithDetails } from '@/types/anime';
import LanguageSelector from '@/components/Player/LanguageSelector';
import EpisodeList from '@/components/Player/EpisodeList';
import {
  Play,
  Calendar,
  Layers,
  ShieldCheck,
  Tag,
  ArrowLeft,
} from 'lucide-react';

interface AnimeDetailsClientProps {
  anime: AnimeWithDetails;
}

export default function AnimeDetailsClient({ anime }: AnimeDetailsClientProps) {
  const validVersions = anime.versions.filter(
    (v) => v.verificationStatus === 'verified' && v.episodes.length > 0
  );

  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    validVersions[0]?.id || validVersions[0]?._id || ''
  );

  const currentVersion =
    validVersions.find((v) => (v.id || v._id) === selectedVersionId) || validVersions[0];

  const firstEpisode = currentVersion?.episodes[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Back button */}
      <div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-xs text-[#A1A1B0] hover:text-[#F5F5F7] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Catalogue
        </Link>
      </div>

      {/* Hero Overview Panel */}
      <div className="relative rounded-3xl border border-[#282835] bg-[#14141D] overflow-hidden shadow-2xl">
        {/* Backdrop */}
        {anime.backdrop && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-sm"
            style={{ backgroundImage: `url(${anime.backdrop})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#14141D] via-[#14141D]/80 to-transparent" />

        <div className="relative p-6 sm:p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Card */}
          <div className="w-48 sm:w-56 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden border border-[#2D2D3A] shadow-2xl bg-black/40">
            <img
              src={anime.poster}
              alt={anime.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Metadata & Actions */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#202029] text-[#F5F5F7] border border-[#2D2D3A]">
                {anime.status}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#A1A1B0] bg-[#202029] px-2.5 py-0.5 rounded-full border border-[#2D2D3A]">
                <Calendar className="w-3 h-3" />
                {anime.releaseYear}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#FF5A81] bg-[#FF3D69]/15 px-2.5 py-0.5 rounded-full border border-[#FF3D69]/30 font-semibold">
                <ShieldCheck className="w-3 h-3" />
                Verified YouTube Release
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F7] tracking-tight">
              {anime.title}
            </h1>

            {/* Genres */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#686878]" />
              {anime.genres.map((g) => (
                <span
                  key={g}
                  className="text-xs px-2.5 py-0.5 rounded-lg bg-[#202029] text-[#A1A1B0] border border-[#2D2D3A]"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <div className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#686878]">
                Synopsis
              </h3>
              <p className="text-xs sm:text-sm text-[#F5F5F7]/90 leading-relaxed max-w-3xl">
                {anime.synopsis}
              </p>
            </div>

            {/* Primary Watch Action */}
            {firstEpisode ? (
              <div className="pt-2">
                <Link
                  href={`/watch/${anime.slug}/${firstEpisode.id || firstEpisode._id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF3D69] hover:bg-[#FF5A81] text-white text-xs sm:text-sm font-semibold shadow-lg shadow-[#FF3D69]/25 transition-all"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>Start Watching EP 1</span>
                  <span className="text-[11px] opacity-80">
                    ({currentVersion?.audioLanguage} Dub)
                  </span>
                </Link>
              </div>
            ) : (
              <div className="text-xs text-[#A1A1B0] bg-[#202029] p-3 rounded-xl border border-[#2D2D3A] max-w-md">
                Episodes for this title are currently awaiting verification before publication.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Language Version & Episodes Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#22222E] pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#FF3D69]" />
            <h2 className="text-base font-bold text-[#F5F5F7]">
              Available Episodes & Versions
            </h2>
          </div>

          {currentVersion?.subtitleLanguages && currentVersion.subtitleLanguages.length > 0 && (
            <div className="text-xs text-[#A1A1B0]">
              Subtitles: {currentVersion.subtitleLanguages.join(', ')}
            </div>
          )}
        </div>

        {validVersions.length > 1 && (
          <LanguageSelector
            versions={validVersions}
            selectedVersionId={selectedVersionId}
            onSelectVersion={setSelectedVersionId}
          />
        )}

        {currentVersion && (
          <div className="space-y-2">
            <div className="text-xs text-[#A1A1B0] flex items-center justify-between">
              <span>
                Streaming via official partner:{' '}
                <strong className="text-[#F5F5F7]">{currentVersion.channelName}</strong>
              </span>
              <span>{currentVersion.episodes.length} verified episodes</span>
            </div>

            <EpisodeList
              animeSlug={anime.slug}
              episodes={currentVersion.episodes}
            />
          </div>
        )}
      </div>
    </div>
  );
}
