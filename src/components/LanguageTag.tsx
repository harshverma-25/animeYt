'use client';
import React from 'react';

interface LanguageTagProps {
  language: string;
  className?: string;
}

export default function LanguageTag({ language, className = '' }: LanguageTagProps) {
  const isHindi = language.toLowerCase() === 'hindi';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full tracking-wide transition-colors ${
        isHindi
          ? 'tag-hindi'
          : 'tag-other'
      } ${className}`}
    >
      {language}
    </span>
  );
}
