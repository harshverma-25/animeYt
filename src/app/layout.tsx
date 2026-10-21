import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import AppShell from '@/components/AppShell';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AnimeYT — Official YouTube Anime Streaming Catalogue',
  description:
    'Discover and watch anime officially published on YouTube through official embeds only. Powered by Muse Asia, Muse India, and Ani-One Asia.',
  keywords: [
    'Anime',
    'AnimeYT',
    'YouTube Anime',
    'Hindi Anime Dub',
    'Japanese Anime',
    'Muse Asia',
    'Muse India',
    'Ani-One Asia',
    'Official Anime',
  ],
  authors: [{ name: 'AnimeYT' }],
  openGraph: {
    title: 'AnimeYT — Official YouTube Anime Catalogue',
    description: 'Discover legally published anime streamed via official YouTube embeds.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${outfit.variable}`}>
      <body className="min-h-screen bg-[#0F0B1A] text-white antialiased font-sans selection:bg-[#D81B60] selection:text-white">
        <Suspense fallback={<div className="min-h-screen bg-[#0F0B1A]" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
