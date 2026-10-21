import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

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

  const languages = ['All', 'Hindi', 'English'];

  return (
    <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-7 w-full">
      {/* Glass Search Pill: responsive height 50px - 56px */}
      <form
        onSubmit={handleSearchSubmit}
        className="glass h-[50px] sm:h-[56px] rounded-full px-4 sm:px-5 flex items-center gap-3 w-full sm:max-w-md md:max-w-xl flex-1 focus-within:border-white/40 transition-all shadow-lg"
      >
        <Search strokeWidth={1.8} className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white/50 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search anime title, genre, or keyword"
          className="bg-transparent text-white placeholder-white/45 text-[14px] sm:text-[15px] outline-none w-full font-normal"
          aria-label="Search anime title, genre, or keyword"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-white/40 hover:text-white text-xs px-2 py-1 rounded-full shrink-0"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </form>

      {/* Segmented language filter pill */}
      <div className="flex items-center justify-center sm:justify-end shrink-0">
        <div className="glass h-[48px] sm:h-[56px] rounded-full p-1 sm:p-1.5 flex items-center gap-1 shadow-lg w-full sm:w-auto justify-center">
          {languages.map((lang) => {
            const isActive = activeLang === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageClick(lang)}
                className={`h-[38px] sm:h-[42px] px-3.5 sm:px-4.5 rounded-full text-[13px] sm:text-[13.5px] font-semibold transition-all ${
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
      </div>
    </header>
  );
}
