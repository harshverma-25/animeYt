'use client';

import { IAnimeVersion } from '@/types/anime';
import { Volume2 } from 'lucide-react';

interface LanguageSelectorProps {
  versions: IAnimeVersion[];
  selectedVersionId: string;
  onSelectVersion: (versionId: string) => void;
}

export default function LanguageSelector({
  versions,
  selectedVersionId,
  onSelectVersion,
}: LanguageSelectorProps) {
  if (!versions || versions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs text-[#A2A2B2] font-medium">
        <Volume2 className="w-3.5 h-3.5 text-[#FF3D69]" />
        <span>Audio Language Version:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {versions.map((ver) => {
          const vId = ver.id || ver._id || '';
          const isSelected = selectedVersionId === vId;

          return (
            <button
              key={vId}
              onClick={() => onSelectVersion(vId)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isSelected
                  ? 'bg-[#FF3D69] text-white border-[#FF3D69] shadow-sm'
                  : 'bg-[#191920] text-[#A2A2B2] border-[#30303A] hover:text-[#F4F4F7] hover:border-[#454553]'
              }`}
            >
              <span>{ver.audioLanguage} Dub</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded ${
                  isSelected
                    ? 'bg-black/30 text-white'
                    : 'bg-[#202028] text-[#A2A2B2]'
                }`}
              >
                {ver.channelName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
