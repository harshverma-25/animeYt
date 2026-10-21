import React from 'react';
import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] w-full py-8">
      <div className="glass rounded-[36px] p-8 sm:p-12 text-center max-w-[520px] w-full flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-[#D81B60]/20 flex items-center justify-center text-[#FF8FB4] mb-4">
          <span className="text-3xl font-extrabold">404</span>
        </div>
        <h1 className="text-[26px] font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-[14px] text-white/65 mb-6 leading-relaxed">
          The page or anime title you were searching for does not exist in our official catalogue.
        </p>
        <Link href="/" className="btn-primary text-[15px] px-8">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
