'use client';

interface LanguageFilterProps {
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  availableLanguages?: string[];
}

export default function LanguageFilter({
  selectedLanguage,
  onSelectLanguage,
  availableLanguages = ['All', 'Hindi', 'English'],
}: LanguageFilterProps) {
  const options = Array.from(new Set(['All', ...availableLanguages]));

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
      <span className="text-xs text-[#A2A2B2] mr-1 hidden sm:inline-block font-medium">
        Audio:
      </span>
      {options.map((lang) => {
        const isSelected = selectedLanguage.toLowerCase() === lang.toLowerCase();
        return (
          <button
            key={lang}
            onClick={() => onSelectLanguage(lang)}
            className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${
              isSelected
                ? 'bg-[#FF3D69] text-white border-[#FF3D69] shadow-sm'
                : 'bg-[#191920] text-[#A2A2B2] border-[#30303A] hover:text-[#F4F4F7] hover:border-[#454553]'
            }`}
          >
            {lang}
          </button>
        );
      })}
    </div>
  );
}
