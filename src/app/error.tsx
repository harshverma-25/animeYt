'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] w-full py-8">
      <div className="glass rounded-[36px] p-8 sm:p-12 text-center max-w-[520px] w-full flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-[#D81B60]/20 flex items-center justify-center text-[#FF8FB4] mb-4">
          <AlertCircle strokeWidth={1.8} className="w-8 h-8" />
        </div>
        <h1 className="text-[24px] font-bold text-white mb-2">Something Went Wrong</h1>
        <p className="text-[14px] text-white/65 mb-6 leading-relaxed">
          An unexpected error occurred while loading this page. Please try again.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => reset()}
            className="btn-primary text-[14px] px-6"
          >
            Try Again
          </button>
          <Link href="/" className="btn-secondary text-[14px] px-6">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
