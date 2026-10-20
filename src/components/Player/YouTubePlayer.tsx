'use client';

import { useState } from 'react';
import { ExternalLink, AlertTriangle, ShieldCheck } from 'lucide-react';

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  channelName?: string;
}

export default function YouTubePlayer({ videoId, title, channelName }: YouTubePlayerProps) {
  const [hasPlaybackNotice, setHasPlaybackNotice] = useState(false);

  const youtubeWatchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div className="flex flex-col w-full rounded-2xl overflow-hidden border border-[#30303A] bg-[#15151C] shadow-lg">
      {/* 16:9 Video Container */}
      <div className="relative w-full aspect-video bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>

      {/* Player Meta & Attribution Bar */}
      <div className="p-4 bg-[#191920] border-t border-[#30303A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-medium text-[#A2A2B2] bg-[#202028] px-2 py-0.5 rounded border border-[#30303A]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF3D69]" />
            Official Stream: {channelName || 'Licensed Partner'}
          </span>
          <span className="text-[#A2A2B2]/60 hidden md:inline">•</span>
          <span className="text-[#A2A2B2] text-[11px] hidden md:inline">
            Preserves YouTube native licensing & creator ads
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setHasPlaybackNotice(!hasPlaybackNotice)}
            className="text-[11px] text-[#A2A2B2] hover:text-[#F4F4F7] underline decoration-dotted transition-colors"
          >
            Playback issue?
          </button>

          <a
            href={youtubeWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202028] hover:bg-[#282834] text-[#F4F4F7] text-xs font-medium border border-[#30303A] hover:border-[#FF3D69]/40 transition-colors"
          >
            <span>Watch on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#FF3D69]" />
          </a>
        </div>
      </div>

      {/* Graceful Fallback Notice (if user toggles or video is region locked) */}
      {hasPlaybackNotice && (
        <div className="p-3 bg-[#202028]/80 border-t border-[#30303A] text-xs flex items-start gap-2.5 text-[#A2A2B2]">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-medium text-[#F4F4F7]">
              Regional restriction or embed disabled?
            </p>
            <p className="text-[11px] text-[#A2A2B2] leading-relaxed">
              Official YouTube channels like Muse Asia and Ani-One restrict certain anime licenses to specific regions (such as South or Southeast Asia). If the embedded player displays &quot;Video unavailable&quot;, you can watch it directly on the publisher&apos;s verified YouTube channel.
            </p>
            <div className="pt-1">
              <a
                href={youtubeWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[#FF5A81] hover:underline font-medium"
              >
                Open official video on YouTube <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
