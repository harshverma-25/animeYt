import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service — AnimeYT',
  description: 'Terms of service and legal notice for AnimeYT.',
};

export default function TermsPage() {
  return (
    <div className="w-full flex justify-center py-4">
      {/* Centered glass content card, max width 720px */}
      <article className="glass rounded-[36px] p-8 sm:p-12 max-w-[720px] w-full flex flex-col gap-6 text-white/80 leading-relaxed">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[16px] bg-[#D81B60] flex items-center justify-center text-white shadow-lg">
            <ShieldAlert strokeWidth={1.8} className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[32px] font-extrabold text-white tracking-tight">
              Terms of Service
            </h1>
            <p className="text-[13px] text-white/50">
              Legal notice & disclaimer
            </p>
          </div>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-[18px] font-bold text-white">1. Legal Content Disclaimer</h2>
          <p className="text-[14.5px]">
            AnimeYT is an indexing catalogue. We do not hold copyrights to the anime titles listed. All copyrights, trademarks, and intellectual property belong to their respective studios, publishers, and licensed distributors (including Muse Communication, Medialink, and others).
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[18px] font-bold text-white">2. Embed Compliance</h2>
          <p className="text-[14.5px]">
            All embedded streams strictly comply with the YouTube Terms of Service and API Services Terms of Service. If an official distributor removes a video from YouTube, the corresponding embed will automatically cease playing.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[18px] font-bold text-white">3. Non-Commercial Index</h2>
          <p className="text-[14.5px]">
            This project is intended for discoverability and educational viewing purposes, championing legal anime streaming on public platforms.
          </p>
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
