'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IEpisode } from '@/types/anime';
import { Play, CheckCircle } from 'lucide-react';

interface EpisodeListProps {
  animeSlug: string;
  episodes: IEpisode[];
  currentEpisodeId?: string;
  onSelectEpisode?: (ep: IEpisode) => void;
}

export default function EpisodeList({
  animeSlug,
  episodes,
  currentEpisodeId,
}: EpisodeListProps) {
  // Group episodes by season
  const seasonsMap = new Map<number, IEpisode[]>();
  episodes.forEach((ep) => {
    const s = ep.seasonNumber || 1;
    if (!seasonsMap.has(s)) {
      seasonsMap.set(s, []);
    }
    seasonsMap.get(s)!.push(ep);
  });

  const availableSeasons = Array.from(seasonsMap.keys()).sort((a, b) => a - b);
  const [selectedSeason, setSelectedSeason] = useState<number>(availableSeasons[0] || 1);

  const currentSeasonEpisodes = (seasonsMap.get(selectedSeason) || []).sort(
    (a, b) => a.episodeNumber - b.episodeNumber
  );

  if (episodes.length === 0) {
    return (
      <div className="p-6 text-center rounded-xl bg-[#191920] border border-[#30303A] text-xs text-[#A2A2B2]">
        No verified episodes found for this language version.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Season Tabs (if more than 1 season) */}
      {availableSeasons.length > 1 && (
        <div className="flex items-center gap-2 border-b border-[#30303A] pb-2">
          {availableSeasons.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSeason(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedSeason === s
                  ? 'bg-[#202028] text-[#F4F4F7] border border-[#30303A]'
                  : 'text-[#A2A2B2] hover:text-[#F4F4F7]'
              }`}
            >
              Season {s}
            </button>
          ))}
        </div>
      )}

      {/* Episodes Grid / List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 max-h-[480px] overflow-y-auto pr-1">
        {currentSeasonEpisodes.map((ep) => {
          const epId = ep.id || ep._id;
          const isActive = currentEpisodeId === epId;

          return (
            <Link
              key={epId}
              href={`/watch/${animeSlug}/${epId}`}
              className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-[#202028] border-[#FF3D69] text-[#F4F4F7]'
                  : 'bg-[#191920] border-[#30303A] text-[#A2A2B2] hover:text-[#F4F4F7] hover:border-[#454553]'
              }`}
            >
              {/* Thumbnail Container */}
              <div className="relative w-24 shrink-0 aspect-video rounded-lg overflow-hidden bg-black/50 border border-white/5">
                <img
                  src={
                    ep.thumbnail ||
                    `https://img.youtube.com/vi/${ep.youtubeVideoId}/hqdefault.jpg`
                  }
                  alt={ep.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                    isActive
                      ? 'bg-black/40 opacity-100'
                      : 'bg-black/30 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <Play
                    className={`w-4 h-4 fill-current ${
                      isActive ? 'text-[#FF3D69]' : 'text-white'
                    }`}
                  />
                </div>
                {ep.duration && (
                  <span className="absolute bottom-1 right-1 text-[9px] px-1 py-0.2 rounded bg-black/80 text-white font-mono">
                    {ep.duration}
                  </span>
                )}
              </div>

              {/* Title & Episode Meta */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className={isActive ? 'text-[#FF3D69]' : 'text-[#F4F4F7]'}>
                    EP {ep.episodeNumber}
                  </span>
                  {ep.verificationStatus === 'verified' && (
                    <CheckCircle className="w-3 h-3 text-[#FF3D69] shrink-0" />
                  )}
                </div>
                <p className="text-xs font-medium truncate mt-0.5 text-[#F4F4F7] group-hover:text-[#FF3D69] transition-colors">
                  {ep.title}
                </p>
                <p className="text-[10px] text-[#A2A2B2] mt-0.5">
                  Official YouTube Stream
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
