import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
      <body className="min-h-screen flex flex-col bg-[#101015] text-[#F4F4F7]">
        <Suspense fallback={<div className="h-14 border-b border-[#30303A] bg-[#101015]" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 w-full pb-12">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
