'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  Languages,
  Swords,
  Smile,
  Sparkles,
  Heart,
  Rocket,
  Flame,
  Coffee,
  Settings,
  Play,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const genres = [
    { name: 'Action', icon: Swords },
    { name: 'Adventure', icon: Compass },
    { name: 'Comedy', icon: Smile },
    { name: 'Fantasy', icon: Sparkles },
    { name: 'Romance', icon: Heart },
    { name: 'Sci-Fi', icon: Rocket },
    { name: 'Thriller', icon: Flame },
    { name: 'Slice of Life', icon: Coffee },
  ];

  const content = (
    <div className="flex flex-col h-full justify-between p-4 bg-[#111117] border-r border-[#22222E] select-none text-xs">
      {/* Top Section */}
      <div className="space-y-6">
        {/* Logo & Mobile Close */}
        <div className="flex items-center justify-between px-2 pt-1">
          <Link href="/" className="flex items-center gap-1.5" onClick={onClose}>
            <span className="text-xl font-extrabold tracking-tight text-[#F5F5F7]">
              Anime<span className="text-[#FF3D69]">YT</span>
            </span>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-[#A1A1B0] hover:text-[#F5F5F7] hover:bg-[#1C1C26]"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1">
          <Link
            href="/"
            onClick={onClose}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
              pathname === '/'
                ? 'bg-[#381622] text-[#F5F5F7] border border-[#FF3D69]/30 shadow-sm shadow-[#FF3D69]/5 font-semibold'
                : 'text-[#A1A1B0] hover:text-[#F5F5F7] hover:bg-[#1A1A24]'
            }`}
          >
            <Home className={`w-4 h-4 ${pathname === '/' ? 'text-[#FF3D69]' : 'text-[#A1A1B0]'}`} />
            <span>Home</span>
          </Link>

          <Link
            href="/explore"
            onClick={onClose}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
              pathname === '/explore'
                ? 'bg-[#381622] text-[#F5F5F7] border border-[#FF3D69]/30 font-semibold'
                : 'text-[#A1A1B0] hover:text-[#F5F5F7] hover:bg-[#1A1A24]'
            }`}
          >
            <Compass className={`w-4 h-4 ${pathname === '/explore' ? 'text-[#FF3D69]' : 'text-[#A1A1B0]'}`} />
            <span>Explore</span>
          </Link>
        </nav>

        {/* Languages Section */}
        <div className="space-y-1 pt-1">
          <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#686878]">
            Languages
          </div>
          <div className="space-y-0.5">
            {['Hindi', 'English', 'Japanese'].map((lang) => (
              <Link
                key={lang}
                href={`/explore?audio=${lang}`}
                onClick={onClose}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-[#A1A1B0] hover:text-[#F5F5F7] hover:bg-[#1A1A24] transition-colors"
              >
                <Languages className="w-4 h-4 text-[#686878]" />
                <span>{lang}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Genres Section */}
        <div className="space-y-1 pt-1">
          <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#686878]">
            Genres
          </div>
          <div className="space-y-0.5 max-h-[220px] overflow-y-auto pr-1">
            {genres.map((g) => {
              const Icon = g.icon;
              return (
                <Link
                  key={g.name}
                  href={`/explore?genre=${encodeURIComponent(g.name)}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-[#A1A1B0] hover:text-[#F5F5F7] hover:bg-[#1A1A24] transition-colors"
                >
                  <Icon className="w-4 h-4 text-[#686878]" />
                  <span>{g.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="space-y-3 pt-4 border-t border-[#22222E]">
        <Link
          href="/admin"
          onClick={onClose}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors ${
            pathname.startsWith('/admin')
              ? 'bg-[#381622] text-[#F5F5F7] border border-[#FF3D69]/30 font-semibold'
              : 'text-[#A1A1B0] hover:text-[#F5F5F7] hover:bg-[#1A1A24]'
          }`}
        >
          <Settings className="w-4 h-4 text-[#686878]" />
          <span>Settings</span>
        </Link>

        {/* Promotion Card */}
        <div className="p-3.5 rounded-2xl bg-[#16161F] border border-[#282835] space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#FF3D69] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#FF3D69]/20">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
            <div className="font-bold text-xs text-[#F5F5F7] leading-tight">
              Discover Anime on YouTube
            </div>
          </div>
          <p className="text-[11px] text-[#A1A1B0] leading-snug">
            Watch officially available anime episodes for free.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 sticky top-0 h-screen z-30">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 w-64 max-w-[80vw] z-50 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
