import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Heart, Sparkles, ExternalLink } from 'lucide-react';
import { CHANNELS } from '@/data/anime';

export const metadata = {
  title: 'About AnimeYT — Official YouTube Anime Catalogue',
  description: 'Learn about AnimeYT and our mission to support legal anime distribution on YouTube.',
};

export default function AboutPage() {
  return (
    <div className="w-full flex justify-center py-4">
      {/* Centered glass content card, max width 720px */}
      <article className="glass rounded-[36px] p-8 sm:p-12 max-w-[720px] w-full flex flex-col gap-6 text-white/80 leading-relaxed">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[16px] bg-[#D81B60] flex items-center justify-center text-white shadow-lg">
            <Sparkles strokeWidth={1.8} className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[32px] font-extrabold text-white tracking-tight">
              About Anime<span className="text-[#FF8FB4]">YT</span>
            </h1>
            <p className="text-[13px] text-[#FF8FB4] font-semibold">
              Official YouTube Stream Discovery Platform
            </p>
          </div>
        </div>

        <section className="flex flex-col gap-3 pt-2">
          <h2 className="text-[20px] font-bold text-white">Our Mission</h2>
          <p className="text-[15px]">
            AnimeYT was created to solve a modern anime problem: thousands of episodes are legally published for free on YouTube across various regional channels, but they are scattered across playlists, hard to browse, and easily overlooked.
          </p>
          <p className="text-[15px]">
            We provide a sleek, unified, and organized catalogue that connects anime fans directly to licensed distributors without resorting to piracy or questionable streams.
          </p>
        </section>

        <section className="flex flex-col gap-3 pt-2">
          <h2 className="text-[20px] font-bold text-white">100% Legal & Official</h2>
          <p className="text-[15px]">
            We do not host, store, download, or re-stream any video content. Every single video playback occurs exclusively through official YouTube iframe embeds (<code>youtube-nocookie.com</code>) hosted by verified license holders.
          </p>
          <p className="text-[15px]">
            All advertising royalties, views, and channel engagement go directly to the official distributors.
          </p>
        </section>

        <section className="flex flex-col gap-3 pt-2">
          <h2 className="text-[20px] font-bold text-white">Official Partner Channels</h2>
          <div className="flex flex-col gap-2.5 mt-1">
            {CHANNELS.map((ch) => (
              <a
                key={ch.name}
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-chip rounded-[20px] p-3.5 flex items-center justify-between gap-3 text-white hover:bg-white/15 transition-all"
              >
                <div>
                  <div className="font-semibold text-[15px] flex items-center gap-2">
                    <span>{ch.name}</span>
                    <ShieldCheck strokeWidth={1.8} className="w-4 h-4 text-[#FF8FB4]" />
                  </div>
                  <p className="text-[12px] text-white/60 mt-0.5">{ch.description}</p>
                </div>
                <ExternalLink strokeWidth={1.8} className="w-4 h-4 text-[#FF8FB4] shrink-0" />
              </a>
            ))}
          </div>
        </section>

        <div className="pt-4 border-t border-white/10 flex justify-center">
          <Link href="/" className="btn-primary text-[14px]">
            Back to Home
          </Link>
        </div>
      </article>
    </div>
  );
}
