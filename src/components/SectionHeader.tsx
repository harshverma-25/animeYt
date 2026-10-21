'use client';
import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  viewAllHref?: string;
  actionText?: string;
}

export default function SectionHeader({
  icon,
  title,
  subtitle,
  viewAllHref,
  actionText = 'View All',
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4 pt-4">
      <div className="flex items-center gap-3.5">
        {/* 44px rounded glass tile for icon */}
        <div className="glass w-11 h-11 rounded-[16px] flex items-center justify-center text-[#FF8FB4] shrink-0 shadow-lg">
          {icon}
        </div>
        <div>
          <h2 className="text-[20px] font-bold text-white tracking-tight leading-snug">
            {title}
          </h2>
          <p className="text-[13px] text-white/60 font-normal">
            {subtitle}
          </p>
        </div>
      </div>

      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="glass-chip group inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold text-[#FF8FB4] hover:text-white hover:bg-white/10 transition-all border border-white/15"
        >
          <span>{actionText}</span>
          <ChevronRight strokeWidth={1.8} className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
