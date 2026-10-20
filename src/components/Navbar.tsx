'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, Compass, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [navSearch, setNavSearch] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      router.push(`/explore?query=${encodeURIComponent(navSearch.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#30303A] bg-[#101015]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold tracking-tight text-[#F4F4F7] group-hover:text-white transition-colors">
              Anime<span className="text-[#FF3D69]">YT</span>
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#202028] text-[#A2A2B2] border border-[#30303A]">
              Official
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/'
                  ? 'text-[#F4F4F7] bg-[#191920]'
                  : 'text-[#A2A2B2] hover:text-[#F4F4F7] hover:bg-[#191920]/60'
              }`}
            >
              Home
            </Link>
            <Link
              href="/explore"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith('/explore')
                  ? 'text-[#F4F4F7] bg-[#191920]'
                  : 'text-[#A2A2B2] hover:text-[#F4F4F7] hover:bg-[#191920]/60'
              }`}
            >
              <Compass className="w-4 h-4" />
              Explore
            </Link>
          </nav>
        </div>

        {/* Search Field */}
        <div className="flex-1 max-w-md hidden sm:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A2A2B2]" />
            <input
              type="text"
              placeholder="Search verified anime (e.g. Mob Psycho, Spy x Family)..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#191920] border border-[#30303A] rounded-lg text-[#F4F4F7] placeholder-[#A2A2B2]/60 focus:outline-none focus:border-[#FF3D69] focus:ring-1 focus:ring-[#FF3D69] transition-all"
            />
          </form>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/explore"
            className="sm:hidden p-2 text-[#A2A2B2] hover:text-[#F4F4F7] hover:bg-[#191920] rounded-lg"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </Link>
          <Link
            href="/admin"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#30303A] transition-colors ${
              pathname.startsWith('/admin')
                ? 'bg-[#FF3D69]/10 text-[#FF3D69] border-[#FF3D69]/30'
                : 'text-[#A2A2B2] bg-[#191920] hover:text-[#F4F4F7] hover:border-[#454553]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF3D69]" />
            <span>Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
