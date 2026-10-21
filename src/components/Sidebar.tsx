'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Play,
  Home,
  Compass,
  Globe,
  Settings,
  Sparkles,
  Menu,
  X,
  Bookmark,
} from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { GENRE_COLORS } from '@/data/anime';

const GENRES = [
  { name: 'Action', color: GENRE_COLORS['Action'] },
  { name: 'Adventure', color: GENRE_COLORS['Adventure'] },
  { name: 'Comedy', color: GENRE_COLORS['Comedy'] },
  { name: 'Fantasy', color: GENRE_COLORS['Fantasy'] },
  { name: 'Romance', color: GENRE_COLORS['Romance'] },
  { name: 'Sci-Fi', color: GENRE_COLORS['Sci-Fi'] },
  { name: 'Thriller', color: GENRE_COLORS['Thriller'] },
];

const LANGUAGES = [
  { name: 'Hindi', code: 'hindi' },
  { name: 'English', code: 'english' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { count, isInitialized } = useWatchlist();

  const isHomeActive = pathname === '/';
  const isExploreActive = pathname.startsWith('/explore');

  return (
    <>
      {/* Mobile Hamburger Header (Visible below 900px) */}
      <div className="lg:hidden w-full glass rounded-[28px] p-4 flex items-center justify-between mb-4 z-40">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] bg-[#D81B60] flex items-center justify-center text-white shadow-md">
            <Play strokeWidth={2} className="w-5 h-5 fill-white ml-0.5" />
          </div>
          <span className="text-[22px] font-bold tracking-tight text-white">
            Anime<span className="text-[#FF8FB4]">YT</span>
          </span>
        </Link>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="glass w-11 h-11 rounded-full flex items-center justify-center text-white"
          aria-label={isMobileOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        >
          {isMobileOpen ? <X strokeWidth={1.8} className="w-5 h-5" /> : <Menu strokeWidth={1.8} className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-25 lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Main Glass Sidebar: width 240px, radius 36px, padding 22px */}
      <aside
        className={`glass rounded-[36px] p-[22px] w-[240px] shrink-0 flex flex-col justify-between self-start transition-all duration-300 z-30 ${
          isMobileOpen
            ? 'fixed inset-x-4 top-20 bottom-6 w-auto overflow-y-auto block shadow-2xl border border-white/25 lg:static lg:w-[240px]'
            : 'hidden lg:flex'
        }`}
        style={{ minHeight: 'calc(100vh - 56px)' }}
      >
        <div className="flex flex-col gap-6">
          {/* Logo: 44px rounded square (accent bg, white play) + wordmark "Anime" + "YT" #FF8FB4, 26px/700 */}
          <Link
            href="/"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-3 group pt-1"
          >
            <div className="w-[44px] h-[44px] rounded-[16px] bg-[#D81B60] flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <Play strokeWidth={2} className="w-5 h-5 fill-white ml-0.5" />
            </div>
            <div className="text-[26px] font-bold tracking-tight text-white select-none">
              Anime<span className="text-[#FF8FB4]">YT</span>
            </div>
          </Link>

          {/* Primary Nav: Home & Explore */}
          <nav className="flex flex-col gap-1.5 pt-2">
            <Link
              href="/"
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-full text-[15px] font-semibold transition-all ${
                isHomeActive
                  ? 'bg-white/16 border border-white/24 text-white shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Home strokeWidth={1.8} className="w-5 h-5" />
              <span>Home</span>
            </Link>

            <Link
              href="/explore"
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-full text-[15px] font-semibold transition-all ${
                isExploreActive
                  ? 'bg-white/16 border border-white/24 text-white shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Compass strokeWidth={1.8} className="w-5 h-5" />
              <span>Explore</span>
            </Link>

            <Link
              href="/watchlist"
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-full text-[15px] font-semibold transition-all ${
                pathname === '/watchlist'
                  ? 'bg-white/16 border border-white/24 text-white shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bookmark strokeWidth={1.8} className="w-5 h-5" />
                <span>Watchlist</span>
              </div>
              {isInitialized && count > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#D81B60] text-white shadow-sm">
                  {count}
                </span>
              )}
            </Link>
          </nav>

          {/* LANGUAGES Section: 12px, letter-spacing 0.14em uppercase */}
          <div>
            <h3 className="text-[12px] font-bold text-white/50 tracking-[0.14em] uppercase px-4 mb-2">
              LANGUAGES
            </h3>
            <div className="flex flex-col gap-1">
              {LANGUAGES.map((lang) => {
                const isActive = pathname === `/language/${lang.code}`;
                return (
                  <Link
                    key={lang.code}
                    href={`/language/${lang.code}`}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-[14px] font-medium transition-all ${
                      isActive
                        ? 'bg-white/16 border border-white/24 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Globe strokeWidth={1.8} className="w-4 h-4 text-[#FF8FB4]" />
                    <span>{lang.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* GENRES Section with colored dots */}
          <div>
            <h3 className="text-[12px] font-bold text-white/50 tracking-[0.14em] uppercase px-4 mb-2">
              GENRES
            </h3>
            <div className="flex flex-col gap-1">
              {GENRES.map((genre) => {
                const isActive = pathname === `/genre/${genre.name.toLowerCase()}`;
                return (
                  <Link
                    key={genre.name}
                    href={`/genre/${genre.name.toLowerCase()}`}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-full text-[14px] font-medium transition-all ${
                      isActive
                        ? 'bg-white/16 border border-white/24 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: genre.color }}
                    />
                    <span>{genre.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Settings link with top divider */}
          <div className="pt-2 border-t border-white/10">
            <Link
              href="/settings"
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-[14px] font-medium transition-all ${
                pathname === '/settings'
                  ? 'bg-white/16 border border-white/24 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings strokeWidth={1.8} className="w-4 h-4 text-white/70" />
              <span>Settings</span>
            </Link>
          </div>
        </div>

        {/* Bottom Promo Card */}
        <div className="glass-chip rounded-[24px] p-4 mt-6 border border-white/15">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles strokeWidth={1.8} className="w-4 h-4 text-[#FF8FB4]" />
            <h4 className="text-[13px] font-bold text-white leading-tight">
              Discover Anime on YouTube
            </h4>
          </div>
          <p className="text-[12px] text-white/65 leading-relaxed font-normal">
            Watch officially available anime episodes for free.
          </p>
        </div>
      </aside>
    </>
  );
}
