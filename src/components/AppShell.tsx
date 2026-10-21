'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopSearchBar from '@/components/TopSearchBar';
import Footer from '@/components/Footer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#0D0D12] text-[#F5F5F7]">
      {/* Persistent Desktop Sidebar & Mobile Drawer */}
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Top Search Bar */}
        <header className="sticky top-0 z-20 bg-[#0D0D12]/95 backdrop-blur-md">
          <TopSearchBar onMenuToggle={() => setMobileMenuOpen(true)} />
        </header>

        {/* Page View Body */}
        <main className="flex-1 py-2 sm:py-4">{children}</main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
