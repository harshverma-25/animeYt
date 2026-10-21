'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Play, X } from 'lucide-react';

export default function Footer() {
  const [modalContent, setModalContent] = useState<{ title: string; text: string } | null>(null);

  const openModal = (title: string, text: string) => {
    setModalContent({ title, text });
  };

  return (
    <footer className="w-full mt-16 pt-8 pb-10 border-t border-[#22222E] text-xs text-[#A1A1B0]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left Side: Logo & Attribution */}
        <div className="space-y-2 max-w-lg">
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-[#F5F5F7]">
              Anime<span className="text-[#FF3D69]">YT</span>
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1C1C26] text-[#A1A1B0] border border-[#2B2B38]">
              Official YouTube Catalogue
            </span>
          </div>

          <p className="text-[11px] text-[#A1A1B0] leading-relaxed">
            Discover legally published anime streamed via official YouTube embeds. All playback occurs through the official YouTube Player with licensing attribution preserved.
          </p>
        </div>

        {/* Right Side: Sources & Links */}
        <div className="flex flex-col items-start md:items-end gap-3.5">
          {/* Sources Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-[#686878] uppercase tracking-wider mr-1">
              Sources:
            </span>
            <a
              href="https://youtube.com/@MuseAsia"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16161F] border border-[#282835] text-[#F5F5F7] text-[11px] hover:border-[#FF3D69]/50 transition-colors"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-[#FF3D69]/20 text-[#FF5A81] flex items-center justify-center">
                <Play className="w-2 h-2 fill-current ml-0.2" />
              </div>
              <span>Muse Asia</span>
              <ExternalLink className="w-2.5 h-2.5 text-[#686878]" />
            </a>

            <a
              href="https://youtube.com/@MuseIndia"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16161F] border border-[#282835] text-[#F5F5F7] text-[11px] hover:border-[#FF3D69]/50 transition-colors"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-[#FF3D69]/20 text-[#FF5A81] flex items-center justify-center">
                <Play className="w-2 h-2 fill-current ml-0.2" />
              </div>
              <span>Muse India</span>
              <ExternalLink className="w-2.5 h-2.5 text-[#686878]" />
            </a>

            <a
              href="https://youtube.com/@AniOneAsia"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16161F] border border-[#282835] text-[#F5F5F7] text-[11px] hover:border-[#FF3D69]/50 transition-colors"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-[#FF3D69]/20 text-[#FF5A81] flex items-center justify-center">
                <Play className="w-2 h-2 fill-current ml-0.2" />
              </div>
              <span>Ani-One Asia</span>
              <ExternalLink className="w-2.5 h-2.5 text-[#686878]" />
            </a>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/explore" className="hover:text-[#F5F5F7] transition-colors">
              Explore
            </Link>
            <button
              onClick={() =>
                openModal(
                  'About AnimeYT',
                  'AnimeYT indexes officially licensed anime distributed by verified YouTube channels including Muse Asia, Muse India, and Ani-One Asia. All video streams play directly from YouTube servers using the official IFrame Player API.'
                )
              }
              className="hover:text-[#F5F5F7] transition-colors"
            >
              About
            </button>
            <button
              onClick={() =>
                openModal(
                  'Privacy Policy',
                  'AnimeYT does not collect personal data or store playback telemetry. Any video playback interactions are handled directly by YouTube in accordance with Google\'s privacy policy.'
                )
              }
              className="hover:text-[#F5F5F7] transition-colors"
            >
              Privacy
            </button>
            <button
              onClick={() =>
                openModal(
                  'Terms of Service',
                  'AnimeYT is a discovery catalogue. We do not host, store, or re-transmit copyrighted video files. All rights belong to their respective licensed anime distributors and YouTube creators.'
                )
              }
              className="hover:text-[#F5F5F7] transition-colors"
            >
              Terms
            </button>
          </div>
        </div>
      </div>

      {/* Info Dialog Modal */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#16161F] border border-[#282835] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#F5F5F7]">{modalContent.title}</h3>
              <button
                onClick={() => setModalContent(null)}
                className="p-1 rounded-lg text-[#A1A1B0] hover:text-[#F5F5F7] hover:bg-[#202029]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#A1A1B0] leading-relaxed">{modalContent.text}</p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setModalContent(null)}
                className="px-4 py-2 rounded-xl bg-[#202029] text-xs font-semibold text-[#F5F5F7] hover:bg-[#282835]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
