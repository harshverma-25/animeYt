import Link from 'next/link';
import { ExternalLink, CheckCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-[#30303A] bg-[#101015] py-8 text-xs text-[#A2A2B2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & Attribution */}
        <div className="flex flex-col gap-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-[#F4F4F7] font-semibold text-sm">
            <span>Anime<span className="text-[#FF3D69]">YT</span></span>
            <span className="text-[10px] text-[#A2A2B2] font-normal border border-[#30303A] px-1.5 py-0.5 rounded bg-[#191920]">
              Official YouTube Catalogue
            </span>
          </div>
          <p className="max-w-md text-[#A2A2B2]/80 leading-relaxed">
            Discover legally published anime streamed via official YouTube embeds. All playback occurs through the official YouTube IFrame Player with licensing attribution preserved.
          </p>
        </div>

        {/* Official Channels List */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-[11px] text-[#A2A2B2]/60 uppercase tracking-wider font-medium">
            Sources:
          </span>
          <a
            href="https://youtube.com/@MuseAsia"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#191920] border border-[#30303A] text-[#F4F4F7] hover:border-[#FF3D69]/50 transition-colors"
          >
            <CheckCircle className="w-3 h-3 text-[#FF3D69]" />
            <span>Muse Asia</span>
            <ExternalLink className="w-2.5 h-2.5 text-[#A2A2B2]" />
          </a>
          <a
            href="https://youtube.com/@MuseIndia"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#191920] border border-[#30303A] text-[#F4F4F7] hover:border-[#FF3D69]/50 transition-colors"
          >
            <CheckCircle className="w-3 h-3 text-[#FF3D69]" />
            <span>Muse India</span>
            <ExternalLink className="w-2.5 h-2.5 text-[#A2A2B2]" />
          </a>
          <a
            href="https://youtube.com/@AniOneAsia"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#191920] border border-[#30303A] text-[#F4F4F7] hover:border-[#FF3D69]/50 transition-colors"
          >
            <CheckCircle className="w-3 h-3 text-[#FF3D69]" />
            <span>Ani-One Asia</span>
            <ExternalLink className="w-2.5 h-2.5 text-[#A2A2B2]" />
          </a>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-4 text-[#A2A2B2]">
          <Link href="/explore" className="hover:text-[#F4F4F7] transition-colors">
            Explore
          </Link>
          <Link href="/admin" className="hover:text-[#F4F4F7] transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
