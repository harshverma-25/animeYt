'use client';

import { useState, useEffect, useCallback } from 'react';
import { IAnime, IAnimeVersion, IEpisode, ISourceChannel, VerificationStatus } from '@/types/anime';
import {
  ShieldCheck,
  Lock,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Video,
  Database,
  ExternalLink,
  Loader2,
  Film,
} from 'lucide-react';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Overview data
  const [animeList, setAnimeList] = useState<IAnime[]>([]);
  const [versions, setVersions] = useState<IAnimeVersion[]>([]);
  const [episodes, setEpisodes] = useState<IEpisode[]>([]);
  const [channels, setChannels] = useState<ISourceChannel[]>([]);
  const [youtubeConfigured, setYoutubeConfigured] = useState(false);

  // Modal / Form states
  const [activeTab, setActiveTab] = useState<'review' | 'import' | 'addAnime' | 'addEpisode'>('review');

  // Form states
  const [newAnime, setNewAnime] = useState({
    title: '',
    synopsis: '',
    poster: '',
    genres: 'Action, Supernatural',
    releaseYear: 2024,
    status: 'Ongoing',
  });

  const [importForm, setImportForm] = useState({
    type: 'playlist',
    targetId: '',
    animeId: '',
    versionId: '',
  });

  // Load overview data
  const loadOverview = useCallback(async (key: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { 'x-admin-secret': key },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setIsAuthenticated(false);
          setMessage({ type: 'error', text: 'Invalid administrator secret key.' });
          return;
        }
        throw new Error('Failed to load admin data');
      }

      const json = await res.json();
      if (json.success) {
        setIsAuthenticated(true);
        setAnimeList(json.data.anime || []);
        setVersions(json.data.versions || []);
        setEpisodes(json.data.episodes || []);
        setChannels(json.data.channels || []);
        setYoutubeConfigured(json.youtubeConfigured);
        // Persist admin secret in sessionStorage
        sessionStorage.setItem('animeyt_admin_key', key);
      }
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  // Check saved key on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('animeyt_admin_key');
    if (saved) {
      setAdminKey(saved);
      loadOverview(saved);
    }
  }, [loadOverview]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey.trim()) {
      loadOverview(adminKey.trim());
    }
  };

  // Seed DB handler
  const handleSeed = async () => {
    if (!confirm('This will seed the database with verified official anime episodes. Continue?')) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'x-admin-secret': adminKey },
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        loadOverview(adminKey);
      } else {
        setMessage({ type: 'error', text: data.error || 'Seed failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  // Toggle episode verification status
  const handleStatusChange = async (id: string, newStatus: VerificationStatus) => {
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminKey,
        },
        body: JSON.stringify({
          type: 'episode',
          id,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEpisodes((prev) =>
          prev.map((ep) =>
            (ep.id || ep._id) === id ? { ...ep, verificationStatus: newStatus } : ep
          )
        );
        setMessage({ type: 'success', text: `Episode status updated to ${newStatus}.` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Update failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    }
  };

  // Add anime handler
  const handleAddAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const genresArray = newAnime.genres.split(',').map((g) => g.trim()).filter(Boolean);
      const res = await fetch('/api/admin/anime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminKey,
        },
        body: JSON.stringify({
          ...newAnime,
          genres: genresArray,
          releaseYear: Number(newAnime.releaseYear),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: `Anime "${newAnime.title}" saved successfully!` });
        setNewAnime({
          title: '',
          synopsis: '',
          poster: '',
          genres: 'Action, Supernatural',
          releaseYear: 2024,
          status: 'Ongoing',
        });
        loadOverview(adminKey);
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to save anime' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  // YouTube import handler
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/youtube/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminKey,
        },
        body: JSON.stringify(importForm),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: json.message });
        loadOverview(adminKey);
      } else {
        setMessage({ type: 'error', text: json.error || 'Import failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  // If not authenticated, render login gate
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-[#191920] border border-[#30303A] space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#202028] border border-[#30303A] flex items-center justify-center mx-auto text-[#FF3D69]">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-[#F4F4F7]">Administrator Access</h1>
          <p className="text-xs text-[#A2A2B2]">
            Enter your admin secret key to manage catalogue verification and imports.
          </p>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-xs font-medium ${
              message.type === 'error'
                ? 'bg-red-950/40 text-red-300 border border-red-500/30'
                : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A2A2B2] mb-1.5">
              Admin Secret Key
            </label>
            <input
              type="password"
              placeholder="Enter ADMIN_SECRET_KEY..."
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#101015] border border-[#30303A] rounded-lg text-[#F4F4F7] focus:outline-none focus:border-[#FF3D69]"
              required
            />
            <p className="text-[11px] text-[#A2A2B2]/60 mt-1">
              Configured via `ADMIN_SECRET_KEY` in .env.local (default in dev: animeyt-admin-dev-key)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#FF3D69] hover:bg-[#FF5A81] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Authenticate Admin
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#191920] border border-[#30303A]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#FF3D69]" />
            <h1 className="text-lg font-bold text-[#F4F4F7]">
              AnimeYT Catalogue Administration
            </h1>
          </div>
          <p className="text-xs text-[#A2A2B2] mt-0.5">
            Manage anime metadata, review imported YouTube videos, and configure official sources.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadOverview(adminKey)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[#202028] text-[#F4F4F7] border border-[#30303A] hover:bg-[#282834]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleSeed}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[#202028] text-[#FF5A81] border border-[#FF3D69]/30 hover:bg-[#FF3D69]/10"
          >
            <Database className="w-3.5 h-3.5" />
            Seed / Reset Initial Data
          </button>

          <button
            onClick={() => {
              sessionStorage.removeItem('animeyt_admin_key');
              setIsAuthenticated(false);
            }}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#101015] text-[#A2A2B2] border border-[#30303A] hover:text-[#F4F4F7]"
          >
            Lock
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium ${
            message.type === 'error'
              ? 'bg-red-950/40 text-red-200 border border-red-500/30'
              : 'bg-emerald-950/40 text-emerald-200 border border-emerald-500/30'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#191920] border border-[#30303A]">
          <span className="text-[11px] text-[#A2A2B2]">Total Anime Titles</span>
          <p className="text-xl font-bold text-[#F4F4F7] mt-0.5">{animeList.length}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-[#191920] border border-[#30303A]">
          <span className="text-[11px] text-[#A2A2B2]">Language Versions</span>
          <p className="text-xl font-bold text-[#F4F4F7] mt-0.5">{versions.length}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-[#191920] border border-[#30303A]">
          <span className="text-[11px] text-[#A2A2B2]">Total Episodes</span>
          <p className="text-xl font-bold text-[#F4F4F7] mt-0.5">{episodes.length}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-[#191920] border border-[#30303A]">
          <span className="text-[11px] text-[#A2A2B2]">YouTube API Status</span>
          <p className="text-xs font-bold mt-1.5 flex items-center gap-1.5">
            {youtubeConfigured ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Configured
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Key Missing (Fallback Mode)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-[#30303A] gap-2">
        <button
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'review'
              ? 'border-[#FF3D69] text-[#FF5A81]'
              : 'border-transparent text-[#A2A2B2] hover:text-[#F4F4F7]'
          }`}
        >
          Verification Workflow ({episodes.filter((e) => e.verificationStatus === 'unverified').length} Pending)
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'import'
              ? 'border-[#FF3D69] text-[#FF5A81]'
              : 'border-transparent text-[#A2A2B2] hover:text-[#F4F4F7]'
          }`}
        >
          YouTube Video Discovery
        </button>
        <button
          onClick={() => setActiveTab('addAnime')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'addAnime'
              ? 'border-[#FF3D69] text-[#FF5A81]'
              : 'border-transparent text-[#A2A2B2] hover:text-[#F4F4F7]'
          }`}
        >
          Add Anime Metadata
        </button>
      </div>

      {/* TAB 1: Review & Verification Workflow */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          <div className="text-xs text-[#A2A2B2] bg-[#191920] p-3 rounded-xl border border-[#30303A]">
            <p className="font-semibold text-[#F4F4F7]">Official Release Verification Policy</p>
            <p className="mt-0.5">
              Only episodes marked as <strong className="text-emerald-400">verified</strong> appear on public user pages. Videos marked as unverified or unavailable are hidden from search and exploration.
            </p>
          </div>

          <div className="rounded-xl border border-[#30303A] bg-[#191920] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#15151C] text-[#A2A2B2] uppercase text-[10px] tracking-wider border-b border-[#30303A]">
                  <tr>
                    <th className="p-3">Episode</th>
                    <th className="p-3">Title & Video ID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30303A]/60">
                  {episodes.map((ep) => {
                    const epId = ep.id || ep._id || '';
                    return (
                      <tr key={epId} className="hover:bg-[#202028]/50">
                        <td className="p-3 font-semibold text-[#F4F4F7] whitespace-nowrap">
                          EP {ep.episodeNumber} (S{ep.seasonNumber})
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-[#F4F4F7]">{ep.title}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#A2A2B2]">
                            <span className="font-mono">{ep.youtubeVideoId}</span>
                            <a
                              href={`https://youtube.com/watch?v=${ep.youtubeVideoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF5A81] hover:underline inline-flex items-center gap-0.5"
                            >
                              Test YouTube <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              ep.verificationStatus === 'verified'
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                                : ep.verificationStatus === 'unavailable'
                                ? 'bg-red-950/60 text-red-300 border border-red-500/30'
                                : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {ep.verificationStatus}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {ep.verificationStatus !== 'verified' && (
                              <button
                                onClick={() => handleStatusChange(epId, 'verified')}
                                className="px-2 py-1 text-[11px] rounded bg-emerald-900/40 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-800/40"
                              >
                                Mark Verified
                              </button>
                            )}
                            {ep.verificationStatus !== 'unavailable' && (
                              <button
                                onClick={() => handleStatusChange(epId, 'unavailable')}
                                className="px-2 py-1 text-[11px] rounded bg-red-900/40 text-red-300 border border-red-500/40 hover:bg-red-800/40"
                              >
                                Mark Unavailable
                              </button>
                            )}
                            {ep.verificationStatus !== 'unverified' && (
                              <button
                                onClick={() => handleStatusChange(epId, 'unverified')}
                                className="px-2 py-1 text-[11px] rounded bg-[#202028] text-[#A2A2B2] border border-[#30303A]"
                              >
                                Pending Review
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: YouTube Import */}
      {activeTab === 'import' && (
        <div className="p-5 rounded-2xl bg-[#191920] border border-[#30303A] space-y-4 max-w-2xl">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[#F4F4F7] flex items-center gap-2">
              <Video className="w-4 h-4 text-red-500" />
              Import Videos from YouTube Channel or Playlist
            </h2>
            <p className="text-xs text-[#A2A2B2]">
              Imported episodes are created as <strong className="text-amber-400">unverified</strong> for administrative review prior to public discovery.
            </p>
          </div>

          <form onSubmit={handleImport} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#A2A2B2] mb-1">
                Source Target Type
              </label>
              <select
                value={importForm.type}
                onChange={(e) => setImportForm({ ...importForm, type: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#101015] border border-[#30303A] rounded-lg text-[#F4F4F7]"
              >
                <option value="playlist">YouTube Playlist ID (e.g. PLwLSw1_Lnc5x2Z8lqQn4n5jD8p)</option>
                <option value="channel">Official Channel ID (e.g. UCGbsPEK2iN416c1Nl3dFh7w)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A2A2B2] mb-1">
                Target YouTube Playlist ID / Channel ID
              </label>
              <input
                type="text"
                placeholder="PLwLSw1_Lnc5x2Z8lqQn4n5jD8p"
                value={importForm.targetId}
                onChange={(e) => setImportForm({ ...importForm, targetId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#101015] border border-[#30303A] rounded-lg text-[#F4F4F7] font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#A2A2B2] mb-1">
                  Assign to Anime
                </label>
                <select
                  value={importForm.animeId}
                  onChange={(e) => setImportForm({ ...importForm, animeId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#101015] border border-[#30303A] rounded-lg text-[#F4F4F7]"
                >
                  <option value="">Select Anime (Optional)</option>
                  {animeList.map((a) => (
                    <option key={a.id || a.slug} value={a.id || a._id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A2A2B2] mb-1">
                  Assign to Language Version
                </label>
                <select
                  value={importForm.versionId}
                  onChange={(e) => setImportForm({ ...importForm, versionId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#101015] border border-[#30303A] rounded-lg text-[#F4F4F7]"
                >
                  <option value="">Select Version (Optional)</option>
                  {versions
                    .filter((v) => !importForm.animeId || v.anime === importForm.animeId)
                    .map((v) => (
                      <option key={v.id || v._id} value={v.id || v._id}>
                        {v.audioLanguage} ({v.channelName})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-2 px-4 rounded-xl bg-[#FF3D69] text-white text-xs font-semibold hover:bg-[#FF5A81] transition-colors disabled:opacity-50"
            >
              {loading ? 'Importing from YouTube...' : 'Start YouTube Import'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Add Anime Metadata */}
      {activeTab === 'addAnime' && (
        <div className="p-5 rounded-2xl bg-[#191920] border border-[#30303A] space-y-4 max-w-2xl">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[#F4F4F7] flex items-center gap-2">
              <Film className="w-4 h-4 text-[#FF3D69]" />
              Add or Edit Anime Catalogue Entry
            </h2>
          </div>

          <form onSubmit={handleAddAnime} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#A2A2B2] mb-1">Anime Title</label>
              <input
                type="text"
                placeholder="e.g. Mob Psycho 100"
                value={newAnime.title}
                onChange={(e) => setNewAnime({ ...newAnime, title: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#101015] border border-[#30303A] rounded-lg text-[#F4F4F7]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A2A2B2] mb-1">Synopsis</label>
              <textarea
                placeholder="Short plot summary..."
                value={newAnime.synopsis}
                onChange={(e) => setNewAnime({ ...newAnime, synopsis: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-xs bg-[#101015] border border-[#30303A] rounded-lg text-[#F4F4F7]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#A2A2B2] mb-1">
                  Poster Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newAnime.poster}
                  onChange={(e) => setNewAnime({ ...newAnime, poster: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#101015] border border-[#30303A] rounded-lg text-[#F4F4F7]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A2A2B2] mb-1">
                  Genres (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Action, Supernatural, Comedy"
                  value={newAnime.genres}
                  onChange={(e) => setNewAnime({ ...newAnime, genres: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#101015] border border-[#30303A] rounded-lg text-[#F4F4F7]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#A2A2B2] mb-1">Release Year</label>
                <input
                  type="number"
                  value={newAnime.releaseYear}
                  onChange={(e) => setNewAnime({ ...newAnime, releaseYear: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-[#101015] border border-[#30303A] rounded-lg text-[#F4F4F7]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A2A2B2] mb-1">Status</label>
                <select
                  value={newAnime.status}
                  onChange={(e) => setNewAnime({ ...newAnime, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#101015] border border-[#30303A] rounded-lg text-[#F4F4F7]"
                >
                  <option value="Completed">Completed</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Upcoming">Upcoming</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-2 px-4 rounded-xl bg-[#FF3D69] text-white text-xs font-semibold hover:bg-[#FF5A81] transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving Anime...' : 'Save Anime to Catalogue'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
