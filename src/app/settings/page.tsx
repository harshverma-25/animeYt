'use client';
import React, { useState } from 'react';
import { Settings, Shield, Bell, Moon, Play } from 'lucide-react';

export default function SettingsPage() {
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [preferHindi, setPreferHindi] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [highQuality, setHighQuality] = useState(true);

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      {/* Header Glass Card */}
      <div className="glass rounded-[36px] p-6 sm:p-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-[18px] bg-[#D81B60] flex items-center justify-center text-white shadow-lg">
          <Settings strokeWidth={1.8} className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-extrabold text-white tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-[14px] text-white/65 mt-0.5">
            Customize your AnimeYT viewing and playback preferences.
          </p>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="glass rounded-[36px] p-6 sm:p-8 flex flex-col gap-6">
        <h2 className="text-[18px] font-bold text-white pb-2 border-b border-white/10">
          Playback Controls
        </h2>

        {/* Toggle 1: Autoplay next */}
        <div className="flex items-center justify-between gap-4 py-2">
          <div>
            <h3 className="text-[15px] font-semibold text-white">Autoplay Next Episode</h3>
            <p className="text-[13px] text-white/60">
              Automatically advance to the next official episode when video finishes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAutoplayNext(!autoplayNext)}
            className={`w-14 h-8 rounded-full p-1 transition-colors relative duration-200 ${
              autoplayNext ? 'bg-[#D81B60]' : 'bg-white/20'
            }`}
            aria-pressed={autoplayNext}
            aria-label="Toggle Autoplay Next Episode"
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform duration-200 shadow-md ${
                autoplayNext ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle 2: Preferred Hindi Dub */}
        <div className="flex items-center justify-between gap-4 py-2 border-t border-white/10">
          <div>
            <h3 className="text-[15px] font-semibold text-white">Prioritize Hindi Audio</h3>
            <p className="text-[13px] text-white/60">
              Default to Muse India / Hindi audio tracks whenever available.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPreferHindi(!preferHindi)}
            className={`w-14 h-8 rounded-full p-1 transition-colors relative duration-200 ${
              preferHindi ? 'bg-[#D81B60]' : 'bg-white/20'
            }`}
            aria-pressed={preferHindi}
            aria-label="Prioritize Hindi Audio"
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform duration-200 shadow-md ${
                preferHindi ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle 3: Notifications */}
        <div className="flex items-center justify-between gap-4 py-2 border-t border-white/10">
          <div>
            <h3 className="text-[15px] font-semibold text-white">New Episode Alerts</h3>
            <p className="text-[13px] text-white/60">
              Notify when official distributors publish new simulcast episodes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNotifications(!notifications)}
            className={`w-14 h-8 rounded-full p-1 transition-colors relative duration-200 ${
              notifications ? 'bg-[#D81B60]' : 'bg-white/20'
            }`}
            aria-pressed={notifications}
            aria-label="New Episode Alerts"
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform duration-200 shadow-md ${
                notifications ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="glass-chip rounded-[24px] p-5 mt-4 border border-white/15">
          <div className="flex items-center gap-2 mb-2 text-[#FF8FB4]">
            <Shield strokeWidth={1.8} className="w-5 h-5" />
            <h4 className="text-[14px] font-bold text-white">Embedded Playback Guarantee</h4>
          </div>
          <p className="text-[13px] text-white/65 leading-relaxed">
            AnimeYT exclusively embeds videos directly from verified official YouTube channels (Muse Asia, Muse India, Ani-One Asia). All advertising revenue, views, and creator metrics are delivered directly to the rightful copyright holders on YouTube.
          </p>
        </div>
      </div>
    </div>
  );
}
