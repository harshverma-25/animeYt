import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — AnimeYT',
  description: 'Privacy policy for AnimeYT official YouTube streaming catalogue.',
};

export default function PrivacyPage() {
  return (
    <div className="w-full flex justify-center py-4">
      {/* Centered glass content card, max width 720px */}
      <article className="glass rounded-[36px] p-8 sm:p-12 max-w-[720px] w-full flex flex-col gap-6 text-white/80 leading-relaxed">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[16px] bg-[#D81B60] flex items-center justify-center text-white shadow-lg">
            <ShieldCheck strokeWidth={1.8} className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[32px] font-extrabold text-white tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-[13px] text-white/50">
              Last updated: October 2026
            </p>
          </div>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-[18px] font-bold text-white">1. Information Collection</h2>
          <p className="text-[14.5px]">
            AnimeYT does not require user accounts or collect personally identifiable information (PII). Any user settings (such as your watchlist or volume preferences) are stored strictly on your local browser device.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[18px] font-bold text-white">2. YouTube Embeds & Third-Party Cookies</h2>
          <p className="text-[14.5px]">
            All video playback utilizes YouTube&apos;s privacy-enhanced domain (<code>youtube-nocookie.com</code>). When you interact with the player, YouTube may store cookies or data subject to Google&apos;s Privacy Policy.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[18px] font-bold text-white">3. Analytics & Telemetry</h2>
          <p className="text-[14.5px]">
            We do not sell, rent, or monetize your personal data. We believe in open, respectful web privacy for anime enthusiasts worldwide.
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
