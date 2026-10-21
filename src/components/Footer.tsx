'use client';
import React from 'react';
import Link from 'next/link';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { CHANNELS } from '@/data/anime';

export default function Footer() {
  return (
    <footer className="glass rounded-[36px] p-7 sm:p-9 mt-12 w-full text-white/75 relative overflow-hidden">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
        {/* Wordmark & Badge */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/" className="text-[26px] font-bold text-white tracking-tight">
              Anime<span className="text-[#FF8FB4]">YT</span>
            </Link>
            <span className="glass-chip inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold text-[#FFC2D6] border border-[#FF8FB4]/30">
              <ShieldCheck strokeWidth={1.8} className="w-3.5 h-3.5 text-[#FF8FB4]" />
              Official YouTube Catalogue
            </span>
          </div>
          <p className="text-[13.5px] text-white/65 max-w-2xl mt-2 leading-relaxed">
            Discover legally published anime streamed via official YouTube embeds. All playback occurs through the official YouTube Player with licensing attribution preserved.
          </p>
        </div>

        {/* Channels / Sources Pills */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-white/50">
            OFFICIAL SOURCES
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {CHANNELS.map((ch) => (
              <a
                key={ch.name}
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-chip inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium text-white/80 hover:text-white hover:bg-white/15 transition-all border border-white/15"
                aria-label={`Visit official ${ch.name} channel on YouTube`}
              >
                <span>{ch.name}</span>
                <ExternalLink strokeWidth={1.8} className="w-3 h-3 text-[#FF8FB4]" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav Links */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-[13px] text-white/55">
        <p>© {new Date().getFullYear()} AnimeYT. Built with official YouTube embeds.</p>
        <div className="flex items-center gap-6">
          <Link href="/explore" className="hover:text-white transition-colors">
            Explore
          </Link>
          <Link href="/about" className="hover:text-white transition-colors">
            About
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
