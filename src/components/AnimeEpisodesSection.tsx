'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Clock, AlertCircle } from 'lucide-react';

interface AnimeEpisodesSectionProps {
  versions: any[];
  animeSlug: string;
}

export default function AnimeEpisodesSection({ versions, animeSlug }: AnimeEpisodesSectionProps) {
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  const currentVersion = versions[selectedVersionIndex] || versions[0];
  const episodes = currentVersion?.episodes || [];

  return (
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
                  key={ver.id || ver.audioLanguage || idx}
                  type="button"
                  onClick={() => setSelectedVersionIndex(idx)}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                    selectedVersionIndex === idx
                      ? 'bg-[#D81B60] text-white shadow-sm'
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
              href={`/watch/${animeSlug}/${ep.id || ep.youtubeVideoId}`}
              className="glass rounded-[24px] p-3 sm:p-4 flex items-center justify-between gap-4 hover:bg-white/[0.12] transition-all group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative w-[110px] sm:w-[130px] aspect-video rounded-[16px] overflow-hidden shrink-0 bg-[#160B24] border border-white/15">
                  <img
                    src={ep.thumbnail || `https://img.youtube.com/vi/${ep.youtubeVideoId}/hqdefault.jpg`}
                    alt={ep.title}
                    width={130}
                    height={73}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
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
  );
}
