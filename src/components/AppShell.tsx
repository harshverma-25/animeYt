'use client';
import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Footer from './Footer';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen bg-[#0F0B1A] text-white overflow-hidden">
      {/* 4 Fixed Ambient Glow Orbs behind everything */}
      <div className="ambient-orb orb-pink" />
      <div className="ambient-orb orb-violet" />
      <div className="ambient-orb orb-teal" />
      <div className="ambient-orb orb-orange" />

      {/* Main Container: Page padding 28px, gap 24px, flex-wrap row */}
      <div className="relative z-10 p-[16px] sm:p-[24px] lg:p-[28px] max-w-[1600px] mx-auto min-h-screen">
        <div className="flex flex-col lg:flex-row gap-[24px] items-start">
          {/* Glass Sidebar */}
          <Sidebar />

          {/* Main Column */}
          <main className="flex-1 w-full min-w-0 flex flex-col">
            {/* Top Bar */}
            <TopBar />

            {/* Page Content */}
            <div className="flex-1 w-full">{children}</div>

            {/* Glass Footer */}
            <Footer />
          </main>
        </div>
      </div>
    </div>
  );
}
