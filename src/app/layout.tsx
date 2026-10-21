import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'AnimeYT — Discover & Watch Official Anime on YouTube',
  description:
    'Discover legally published anime episodes on YouTube with verified audio dubs in Hindi, English, and Japanese from official licensed distributors.',
  keywords: [
    'Anime',
    'Watch Anime',
    'YouTube Anime',
    'Hindi Anime Dub',
    'Official Anime',
    'Muse Asia',
    'Muse India',
    'Ani-One Asia',
    'Demon Slayer',
    'Jujutsu Kaisen',
  ],
  authors: [{ name: 'AnimeYT Team' }],
  openGraph: {
    title: 'AnimeYT — Official YouTube Anime Discovery',
    description:
      'Watch officially licensed full anime episodes legally streamed on YouTube.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-screen bg-[#0D0D12] text-[#F5F5F7] antialiased">
        <Suspense fallback={<div className="min-h-screen bg-[#0D0D12]" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
