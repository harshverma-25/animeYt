'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell } from 'lucide-react';

interface TopBarProps {
  onLanguageFilterChange?: (lang: string) => void;
  selectedLanguage?: string;
}

export default function TopBar({
  onLanguageFilterChange,
  selectedLanguage = 'All',
}: TopBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeLang, setActiveLang] = useState(selectedLanguage);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleLanguageClick = (lang: string) => {
    setActiveLang(lang);
    if (onLanguageFilterChange) {
      onLanguageFilterChange(lang);
    } else {
      if (lang === 'All') {
        router.push('/explore');
      } else {
        router.push(`/language/${lang.toLowerCase()}`);
      }
    }
  };

  const languages = ['All', 'Hindi', 'English', 'Japanese'];

  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-7 w-full">
      {/* Glass Search Pill: height 56px */}
      <form
        onSubmit={handleSearchSubmit}
        className="glass h-[56px] rounded-full px-5 flex items-center gap-3 w-full md:max-w-xl flex-1 focus-within:border-white/40 transition-all shadow-lg"
      >
        <Search strokeWidth={1.8} className="w-5 h-5 text-white/50 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search anime title, genre, or keyword"
          className="bg-transparent text-white placeholder-white/45 text-[15px] outline-none w-full font-normal"
          aria-label="Search anime title, genre, or keyword"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-white/40 hover:text-white text-xs px-2 py-1 rounded-full"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </form>

      {/* Right controls: Segmented Language Pill + Bell + Avatar */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
        {/* Segmented language filter pill */}
        <div className="glass h-[56px] rounded-full p-1.5 flex items-center gap-1 shadow-lg">
          {languages.map((lang) => {
            const isActive = activeLang === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageClick(lang)}
                className={`h-[42px] px-4 rounded-full text-[13.5px] font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-[#1A1428] shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                aria-pressed={isActive}
              >
                {lang}
              </button>
            );
          })}
        </div>

        {/* Round bell button with notification dot */}
        <div className="relative">
          <button
            type="button"
            className="glass w-[56px] h-[56px] rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-all shadow-lg shrink-0"
            aria-label="Notifications"
          >
            <Bell strokeWidth={1.8} className="w-5 h-5" />
          </button>
          {/* Unread notification dot */}
          <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#D81B60] ring-2 ring-[#0F0B1A]" />
        </div>

        {/* Round 56px avatar with the letter 'H' on the accent color */}
        <div
          className="w-[56px] h-[56px] rounded-full bg-[#D81B60] text-white font-bold text-[20px] flex items-center justify-center shadow-lg shrink-0 select-none ring-2 ring-white/20"
          aria-label="User Profile"
        >
          H
        </div>
      </div>
    </header>
  );
}
