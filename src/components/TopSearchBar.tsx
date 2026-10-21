'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, Menu } from 'lucide-react';

interface TopSearchBarProps {
  onMenuToggle?: () => void;
}

export default function TopSearchBar({ onMenuToggle }: TopSearchBarProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/explore?query=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <div className="w-full flex items-center justify-between gap-3 sm:gap-4 py-3 sm:py-4">
      {/* Mobile Menu Button */}
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl bg-[#16161F] border border-[#2B2B38] text-[#A1A1B0] hover:text-[#F5F5F7]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Glass Search Bar */}
      <form onSubmit={handleSubmit} className="relative flex-1 max-w-3xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1B0]" />
        <input
          type="text"
          placeholder="Search anime title, genre, or keyword (e.g. One Piece, Jujutsu Kaisen...)"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 text-xs sm:text-sm bg-[#16161F]/80 backdrop-blur-md border border-[#282836] rounded-2xl text-[#F5F5F7] placeholder-[#A1A1B0]/50 focus:outline-none focus:border-[#FF3D69]/60 focus:ring-1 focus:ring-[#FF3D69]/60 transition-all shadow-sm"
        />
      </form>

      {/* Right User & Notification Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <button
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#16161F] border border-[#282836] text-[#A1A1B0] hover:text-[#F5F5F7] flex items-center justify-center transition-colors"
          title="Notifications"
          onClick={() => alert('No new notifications. You are watching official releases.')}
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User Avatar Circle */}
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FF3D69] text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-md shadow-[#FF3D69]/20 cursor-pointer select-none"
          title="AnimeYT User Profile"
        >
          H
        </div>
      </div>
    </div>
  );
}
