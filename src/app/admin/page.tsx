'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Sparkles,
  Video,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Search,
  List,
  Check,
  Film,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UploadCloud,
  Filter,
} from 'lucide-react';

export default function AdminPage() {
  const [secretKey, setSecretKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'episodes' | 'manifest' | 'anilist' | 'candidates' | 'availability' | 'jobs'>('episodes');

  // Episodes Management State
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [episodesTotal, setEpisodesTotal] = useState(0);
  const [episodesPage, setEpisodesPage] = useState(1);
  const [filterAnime, setFilterAnime] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [filterEpStatus, setFilterEpStatus] = useState('all');
  const [epSearchQuery, setEpSearchQuery] = useState('');
  const [animeOptions, setAnimeOptions] = useState<{ id: string; title: string; slug: string }[]>([]);

  // Add Episode Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [addAnimeSlug, setAddAnimeSlug] = useState('');
  const [addAudioLang, setAddAudioLang] = useState('Hindi');
  const [addSeason, setAddSeason] = useState(1);
  const [addEpNumber, setAddEpNumber] = useState(1);
  const [addVideoInput, setAddVideoInput] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [addThumbnail, setAddThumbnail] = useState('');
  const [addPublish, setAddPublish] = useState(true);
  const [addingEpisode, setAddingEpisode] = useState(false);
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Batch / Playlist Import State
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [batchAnimeSlug, setBatchAnimeSlug] = useState('');
  const [batchAudioLang, setBatchAudioLang] = useState('Hindi');
  const [batchSeason, setBatchSeason] = useState(1);
  const [batchVideoText, setBatchVideoText] = useState('');
  const [batchAutoVerify, setBatchAutoVerify] = useState(true);
  const [importingBatch, setImportingBatch] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);

  // Manifest Import State
  const [manifestBatchSize, setManifestBatchSize] = useState(10);
  const [manifestStartIndex, setManifestStartIndex] = useState(0);
  const [manifestFilterLang, setManifestFilterLang] = useState('');
  const [manifestMaxVideos, setManifestMaxVideos] = useState(25);
  const [manifestResumeJobId, setManifestResumeJobId] = useState('');
  const [manifestAutoVerify, setManifestAutoVerify] = useState(false);
  const [importingManifest, setImportingManifest] = useState(false);
  const [manifestReport, setManifestReport] = useState<any>(null);

  // AniList Import State
  const [anilistPages, setAnilistPages] = useState(2);
  const [anilistSearch, setAnilistSearch] = useState('');
  const [importingAniList, setImportingAniList] = useState(false);
  const [anilistResult, setAnilistResult] = useState<any>(null);

  // YouTube Discovery State
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [targetSlug, setTargetSlug] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [discoverResult, setDiscoverResult] = useState<any>(null);

  // Candidate Review State
  const [candidates, setCandidates] = useState<any[]>([]);
  const [candidateFilter, setCandidateFilter] = useState('discovered');
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Availability Check State
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<any>(null);

  // Jobs State
  const [jobs, setJobs] = useState<any[]>([]);

  // Check saved secret on mount
  useEffect(() => {
    const saved = localStorage.getItem('animeyt_admin_secret') || 'animeyt-admin-dev-key';
    if (saved) {
      setSecretKey(saved);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey.trim()) return;
    localStorage.setItem('animeyt_admin_secret', secretKey.trim());
    setIsAuthenticated(true);
  };

  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'x-admin-secret': secretKey.trim() || 'animeyt-admin-dev-key',
  }), [secretKey]);

  const loadAnimeOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/overview', { headers: getHeaders() });
      const data = await res.json();
      if (data.data?.anime) {
        const sorted = data.data.anime
          .map((a: any) => ({ id: a.id || a._id, title: a.title, slug: a.slug }))
          .sort((a: any, b: any) => a.title.localeCompare(b.title));
        setAnimeOptions(sorted);
        if (sorted.length > 0 && !addAnimeSlug) {
          setAddAnimeSlug(sorted[0].slug);
          setBatchAnimeSlug(sorted[0].slug);
        }
      }
    } catch (err) {
      console.error('Failed to load anime options', err);
    }
  }, [getHeaders, addAnimeSlug]);

  const loadEpisodes = useCallback(async () => {
    setLoadingEpisodes(true);
    try {
      const params = new URLSearchParams();
      if (filterAnime) params.set('anime', filterAnime);
      if (filterLang) params.set('language', filterLang);
      if (filterEpStatus && filterEpStatus !== 'all') params.set('status', filterEpStatus);
      if (epSearchQuery.trim()) params.set('q', epSearchQuery.trim());
      params.set('page', episodesPage.toString());
      params.set('limit', '50');

      const res = await fetch(`/api/admin/episodes?${params.toString()}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setEpisodes(data.items || []);
        setEpisodesTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load episodes', err);
    } finally {
      setLoadingEpisodes(false);
    }
  }, [filterAnime, filterLang, filterEpStatus, epSearchQuery, episodesPage, getHeaders]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAnimeOptions();
      loadEpisodes();
    }
  }, [isAuthenticated, loadAnimeOptions, loadEpisodes]);

  const handleCreateEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAnimeSlug || !addVideoInput.trim()) {
      setAddMessage({ type: 'error', text: 'Target anime and YouTube URL/ID are required.' });
      return;
    }
    setAddingEpisode(true);
    setAddMessage(null);
    try {
      const res = await fetch('/api/admin/episodes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          animeSlugOrId: addAnimeSlug,
          audioLanguage: addAudioLang,
          seasonNumber: addSeason,
          episodeNumber: addEpNumber,
          youtubeUrlOrId: addVideoInput.trim(),
          title: addTitle.trim() || undefined,
          thumbnail: addThumbnail.trim() || undefined,
          isPublished: addPublish,
          verificationStatus: addPublish ? 'verified' : 'unverified',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddMessage({ type: 'success', text: `Episode ${addEpNumber} published successfully!` });
        setAddVideoInput('');
        setAddTitle('');
        setAddThumbnail('');
        setAddEpNumber((prev) => prev + 1);
        loadEpisodes();
      } else {
        setAddMessage({ type: 'error', text: data.error || 'Failed to create episode' });
      }
    } catch (err) {
      setAddMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setAddingEpisode(false);
    }
  };

  const handleFetchOEmbedPreview = async () => {
    if (!addVideoInput.trim()) return;
    try {
      const match = addVideoInput.trim().match(/([a-zA-Z0-9_-]{11})/);
      const vid = match ? match[1] : addVideoInput.trim();
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vid}&format=json`);
      if (res.ok) {
        const data = await res.json();
        if (data.title && !addTitle) setAddTitle(data.title);
        if (data.thumbnail_url && !addThumbnail) setAddThumbnail(data.thumbnail_url);
      }
    } catch (err) {
      console.warn('oEmbed preview fetch error', err);
    }
  };

  const handleBatchImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchAnimeSlug || !batchVideoText.trim()) {
      alert('Please select an anime and enter video URLs or IDs');
      return;
    }
    setImportingBatch(true);
    setBatchResult(null);
    try {
      const res = await fetch('/api/admin/import/playlist', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          animeSlugOrId: batchAnimeSlug,
          audioLanguage: batchAudioLang,
          seasonNumber: batchSeason,
          videoInputs: batchVideoText,
          autoVerify: batchAutoVerify,
        }),
      });
      const data = await res.json();
      if (data.report) {
        setBatchResult(data.report);
        loadEpisodes();
      } else {
        alert(data.error || 'Batch import failed');
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setImportingBatch(false);
    }
  };

  const handleVerifySingleEpisode = async (episodeId: string) => {
    try {
      const res = await fetch(`/api/admin/episodes/${episodeId}/verify`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        loadEpisodes();
      } else {
        alert(`Verification failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleTogglePublish = async (episodeId: string, currentPublished: boolean, currentStatus: string) => {
    if (!currentPublished && currentStatus !== 'verified') {
      alert('Cannot publish an unverified or unavailable episode. Run verification first.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/episodes/${episodeId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isPublished: !currentPublished }),
      });
      const data = await res.json();
      if (data.success) {
        loadEpisodes();
      } else {
        alert(data.error || 'Update failed');
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDeleteEpisode = async (episodeId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete episode "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/episodes/${episodeId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        loadEpisodes();
      } else {
        alert(data.error || 'Failed to delete episode');
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // 0. Run Manifest Import
  const handleRunManifestImport = async () => {
    setImportingManifest(true);
    setManifestReport(null);
    try {
      const res = await fetch('/api/admin/import/manifest', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          batchSize: manifestBatchSize,
          startIndex: manifestStartIndex,
          filterLanguage: manifestFilterLang || undefined,
          autoVerifyEligible: manifestAutoVerify,
          maxVideosPerAnime: manifestMaxVideos,
          resumeFromJobId: manifestResumeJobId.trim() || undefined,
        }),
      });
      const data = await res.json();
      setManifestReport(data);
    } catch (err) {
      setManifestReport({ error: (err as Error).message });
    } finally {
      setImportingManifest(false);
    }
  };

  // 1. Run AniList Import
  const handleRunAniListImport = async () => {
    setImportingAniList(true);
    setAnilistResult(null);
    try {
      const res = await fetch('/api/admin/import/anilist', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          page: 1,
          perPage: 25,
          maxPages: anilistPages,
          search: anilistSearch.trim() || undefined,
        }),
      });
      const data = await res.json();
      setAnilistResult(data);
    } catch (err) {
      setAnilistResult({ error: (err as Error).message });
    } finally {
      setImportingAniList(false);
    }
  };

  // 2. Run YouTube Discovery
  const handleDiscoverCandidates = async () => {
    setDiscovering(true);
    setDiscoverResult(null);
    try {
      const res = await fetch('/api/admin/youtube/discover', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          searchQuery: discoverQuery.trim() || undefined,
          targetAnimeSlug: targetSlug.trim() || undefined,
          maxResults: 20,
        }),
      });
      const data = await res.json();
      setDiscoverResult(data);
      loadCandidates();
    } catch (err) {
      setDiscoverResult({ error: (err as Error).message });
    } finally {
      setDiscovering(false);
    }
  };

  // 3. Load Candidates
  const loadCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const res = await fetch(`/api/admin/candidates?status=${candidateFilter}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      setCandidates(data.candidates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'candidates') {
      loadCandidates();
    } else if (isAuthenticated && activeTab === 'jobs') {
      fetch('/api/admin/jobs', { headers: getHeaders() })
        .then((r) => r.json())
        .then((d) => setJobs(d.jobs || []))
        .catch(() => {});
    }
  }, [isAuthenticated, activeTab, candidateFilter]);

  // 4. Verify Candidate
  const handleVerifyCandidate = async (candidateId: string, slug?: string) => {
    try {
      const res = await fetch('/api/admin/candidates/verify', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          candidateId,
          animeSlug: slug || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadCandidates();
      } else {
        alert(data.error || 'Failed to verify candidate');
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // 5. Reject Candidate
  const handleRejectCandidate = async (candidateId: string) => {
    try {
      const res = await fetch('/api/admin/candidates/reject', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ candidateId }),
      });
      const data = await res.json();
      if (data.success) {
        loadCandidates();
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // 6. Availability Check
  const handleRunAvailability = async () => {
    setCheckingAvailability(true);
    try {
      const res = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ limit: 30 }),
      });
      const data = await res.json();
      setAvailabilityResult(data);
    } catch (err) {
      setAvailabilityResult({ error: (err as Error).message });
    } finally {
      setCheckingAvailability(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] w-full py-12">
        <div className="glass rounded-[36px] p-8 max-w-md w-full flex flex-col items-center">
          <div className="w-14 h-14 rounded-[18px] bg-[#D81B60]/20 flex items-center justify-center text-[#FF8FB4] mb-4">
            <ShieldAlert strokeWidth={1.8} className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Administrator Authentication</h1>
          <p className="text-xs text-white/60 mb-6 text-center leading-relaxed">
            Enter the ADMIN_SECRET_KEY to access pipeline import controls and video verification workflows.
          </p>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-3">
            <input
              type="password"
              placeholder="Admin secret key"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="glass rounded-full px-4 py-3 text-sm text-white bg-transparent outline-none w-full"
            />
            <button type="submit" className="btn-primary w-full text-sm">
              Authenticate
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Admin Header */}
      <div className="glass rounded-[36px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold tracking-wider text-[#FF8FB4] uppercase px-2.5 py-0.5 rounded-full bg-[#D81B60]/20">
              PROTECTED PORTAL
            </span>
          </div>
          <h1 className="text-[26px] font-extrabold text-white tracking-tight">
            Catalogue Pipeline & Verification
          </h1>
          <p className="text-[13px] text-white/60 mt-0.5">
            Manage AniList metadata imports, YouTube discovery candidates, and episode verification.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="glass-chip rounded-full p-1 flex items-center gap-1 self-start md:self-auto flex-wrap">
          <button
            onClick={() => setActiveTab('episodes')}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'episodes' ? 'bg-[#D81B60] text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            <Film strokeWidth={1.8} className="w-3.5 h-3.5" />
            Episode Manager
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all ${
              activeTab === 'manifest' ? 'bg-[#D81B60] text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            Manifest Importer
          </button>
          <button
            onClick={() => setActiveTab('anilist')}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all ${
              activeTab === 'anilist' ? 'bg-[#D81B60] text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            AniList Import
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all ${
              activeTab === 'candidates' ? 'bg-[#D81B60] text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            Candidate Review
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all ${
              activeTab === 'availability' ? 'bg-[#D81B60] text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            Availability Check
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all ${
              activeTab === 'jobs' ? 'bg-[#D81B60] text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            Jobs History
          </button>
        </div>
      </div>

      {/* Tab: Episode Manager */}
      {activeTab === 'episodes' && (
        <div className="flex flex-col gap-6 w-full">
          {/* Header Action Bar */}
          <div className="glass rounded-[32px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-[#FF8FB4] px-2.5 py-0.5 rounded-full bg-[#D81B60]/20">
                  ZERO DATA-API DEPENDENCY
                </span>
                <span className="text-[11px] font-semibold text-white/50">
                  {episodesTotal} Database Episodes
                </span>
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Film strokeWidth={1.8} className="w-5 h-5 text-[#FF8FB4]" />
                Official Episode Management & Batch Import
              </h2>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">
                Add, verify, publish, edit, or delete episode records. Imports use public oEmbed for automatic metadata and verification without consuming YouTube API quotas.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              <button
                onClick={() => {
                  setShowAddForm((prev) => !prev);
                  if (showBatchImport) setShowBatchImport(false);
                }}
                className={`btn-primary text-xs px-4 py-2 gap-1.5 ${showAddForm ? 'opacity-80' : ''}`}
              >
                <Plus strokeWidth={2} className="w-3.5 h-3.5" />
                <span>{showAddForm ? 'Close Add Form' : 'Add Episode'}</span>
              </button>

              <button
                onClick={() => {
                  setShowBatchImport((prev) => !prev);
                  if (showAddForm) setShowAddForm(false);
                }}
                className={`glass px-4 py-2 rounded-full text-xs font-semibold text-white/90 hover:text-white transition-all flex items-center gap-1.5 ${
                  showBatchImport ? 'bg-[#D81B60]/30' : ''
                }`}
              >
                <UploadCloud strokeWidth={1.8} className="w-3.5 h-3.5 text-[#FF8FB4]" />
                <span>{showBatchImport ? 'Close Batch Import' : 'Batch / Playlist Import'}</span>
              </button>

              <button
                onClick={() => loadEpisodes()}
                disabled={loadingEpisodes}
                className="glass p-2 rounded-full text-white/70 hover:text-white transition-all"
                title="Refresh episodes"
              >
                <RefreshCw strokeWidth={1.8} className={`w-4 h-4 ${loadingEpisodes ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Form 1: Add Single Episode */}
          {showAddForm && (
            <div className="glass rounded-[32px] p-6 flex flex-col gap-5 border border-[#D81B60]/30">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus strokeWidth={2} className="w-4 h-4 text-[#FF8FB4]" />
                  Add Single Episode
                </h3>
                <span className="text-xs text-white/50">Auto-normalizes YouTube URLs</span>
              </div>

              {addMessage && (
                <div
                  className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                    addMessage.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {addMessage.type === 'success' ? (
                    <CheckCircle2 strokeWidth={1.8} className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle strokeWidth={1.8} className="w-4 h-4 shrink-0" />
                  )}
                  <span>{addMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleCreateEpisode} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Anime Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/80">Target Anime</label>
                  <select
                    value={addAnimeSlug}
                    onChange={(e) => setAddAnimeSlug(e.target.value)}
                    className="glass rounded-xl px-3 py-2 text-xs text-white bg-transparent outline-none w-full"
                    required
                  >
                    <option value="" disabled className="bg-[#181824] text-white">Select an anime</option>
                    {animeOptions.map((a) => (
                      <option key={a.id} value={a.slug} className="bg-[#181824] text-white">
                        {a.title} ({a.slug})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Audio Language */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/80">Audio Language</label>
                  <select
                    value={addAudioLang}
                    onChange={(e) => setAddAudioLang(e.target.value)}
                    className="glass rounded-xl px-3 py-2 text-xs text-white bg-transparent outline-none w-full"
                  >
                    <option value="Hindi" className="bg-[#181824] text-white">Hindi</option>
                    <option value="English" className="bg-[#181824] text-white">English</option>
                    <option value="Japanese" className="bg-[#181824] text-white">Japanese</option>
                    <option value="Tamil" className="bg-[#181824] text-white">Tamil</option>
                    <option value="Telugu" className="bg-[#181824] text-white">Telugu</option>
                  </select>
                </div>

                {/* Season & Episode Number */}
                <div className="flex gap-3">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs font-semibold text-white/80">Season #</label>
                    <input
                      type="number"
                      min={1}
                      value={addSeason}
                      onChange={(e) => setAddSeason(parseInt(e.target.value, 10) || 1)}
                      className="glass rounded-xl px-3 py-2 text-xs text-white bg-transparent outline-none w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs font-semibold text-white/80">Episode #</label>
                    <input
                      type="number"
                      min={1}
                      value={addEpNumber}
                      onChange={(e) => setAddEpNumber(parseInt(e.target.value, 10) || 1)}
                      className="glass rounded-xl px-3 py-2 text-xs text-white bg-transparent outline-none w-full"
                      required
                    />
                  </div>
                </div>

                {/* YouTube URL or Video ID */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white/80">YouTube URL or Video ID</label>
                    <button
                      type="button"
                      onClick={handleFetchOEmbedPreview}
                      className="text-[11px] text-[#FF8FB4] hover:underline"
                    >
                      Fetch Info via oEmbed
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="https://youtube.com/watch?v=... or 11-char ID"
                    value={addVideoInput}
                    onChange={(e) => setAddVideoInput(e.target.value)}
                    className="glass rounded-xl px-3 py-2 text-xs text-white bg-transparent outline-none w-full font-mono"
                    required
                  />
                </div>

                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/80">Episode Title (optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-derived if left empty"
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    className="glass rounded-xl px-3 py-2 text-xs text-white bg-transparent outline-none w-full"
                  />
                </div>

                {/* Thumbnail */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/80">Thumbnail URL (optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-derived from video ID if empty"
                    value={addThumbnail}
                    onChange={(e) => setAddThumbnail(e.target.value)}
                    className="glass rounded-xl px-3 py-2 text-xs text-white bg-transparent outline-none w-full"
                  />
                </div>

                {/* Publish Toggle & Submit */}
                <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto">
                    <input
                      type="checkbox"
                      checked={addPublish}
                      onChange={(e) => setAddPublish(e.target.checked)}
                      className="rounded accent-[#D81B60]"
                    />
                    <span className="text-xs text-white/90 font-medium">
                      Publish immediately in public watch catalogue (sets status to verified)
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={addingEpisode}
                    className="btn-primary text-xs px-6 py-2.5 gap-2 w-full sm:w-auto"
                  >
                    {addingEpisode ? (
                      <RefreshCw strokeWidth={1.8} className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus strokeWidth={2} className="w-3.5 h-3.5" />
                    )}
                    <span>{addingEpisode ? 'Saving Episode...' : 'Save & Publish Episode'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Form 2: Batch / Playlist Import */}
          {showBatchImport && (
            <div className="glass rounded-[32px] p-6 flex flex-col gap-5 border border-[#D81B60]/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <UploadCloud strokeWidth={1.8} className="w-4 h-4 text-[#FF8FB4]" />
                    Batch & Playlist Video Import
                  </h3>
                  <p className="text-xs text-white/60 mt-0.5">
                    Paste a list of YouTube video URLs or IDs from a playlist. The system extracts video IDs, enriches titles and thumbnails via public oEmbed, detects duplicates, and publishes embeddable episodes.
                  </p>
                </div>
              </div>

              <form onSubmit={handleBatchImport} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Anime Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white/80">Target Anime</label>
                    <select
                      value={batchAnimeSlug}
                      onChange={(e) => setBatchAnimeSlug(e.target.value)}
                      className="glass rounded-xl px-3 py-2 text-xs text-white bg-transparent outline-none w-full"
                      required
                    >
                      <option value="" disabled className="bg-[#181824] text-white">Select an anime</option>
                      {animeOptions.map((a) => (
                        <option key={a.id} value={a.slug} className="bg-[#181824] text-white">
                          {a.title} ({a.slug})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Audio Language */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white/80">Audio Language</label>
                    <select
                      value={batchAudioLang}
                      onChange={(e) => setBatchAudioLang(e.target.value)}
                      className="glass rounded-xl px-3 py-2 text-xs text-white bg-transparent outline-none w-full"
                    >
                      <option value="Hindi" className="bg-[#181824] text-white">Hindi</option>
                      <option value="English" className="bg-[#181824] text-white">English</option>
                      <option value="Japanese" className="bg-[#181824] text-white">Japanese</option>
                      <option value="Tamil" className="bg-[#181824] text-white">Tamil</option>
                      <option value="Telugu" className="bg-[#181824] text-white">Telugu</option>
                    </select>
                  </div>

                  {/* Season */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white/80">Default Season #</label>
                    <input
                      type="number"
                      min={1}
                      value={batchSeason}
                      onChange={(e) => setBatchSeason(parseInt(e.target.value, 10) || 1)}
                      className="glass rounded-xl px-3 py-2 text-xs text-white bg-transparent outline-none w-full"
                    />
                  </div>
                </div>

                {/* Textarea for Video URLs or IDs */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/80">
                    Paste YouTube Video URLs or Video IDs (one per line)
                  </label>
                  <textarea
                    rows={6}
                    placeholder="https://www.youtube.com/watch?v=VIDEO_ID_1&#10;https://www.youtube.com/watch?v=VIDEO_ID_2&#10;https://youtu.be/VIDEO_ID_3&#10;dQw4w9WgXcQ"
                    value={batchVideoText}
                    onChange={(e) => setBatchVideoText(e.target.value)}
                    className="glass rounded-2xl p-3 text-xs text-white bg-transparent outline-none w-full font-mono resize-y"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batchAutoVerify}
                      onChange={(e) => setBatchAutoVerify(e.target.checked)}
                      className="rounded accent-[#D81B60]"
                    />
                    <span className="text-xs text-white/90 font-medium">
                      Auto-verify and publish active, embeddable episodes immediately
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={importingBatch}
                    className="btn-primary text-xs px-6 py-2.5 gap-2 w-full sm:w-auto"
                  >
                    {importingBatch ? (
                      <RefreshCw strokeWidth={1.8} className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud strokeWidth={1.8} className="w-3.5 h-3.5" />
                    )}
                    <span>{importingBatch ? 'Importing Videos...' : 'Start Batch Import'}</span>
                  </button>
                </div>
              </form>

              {/* Batch Import Report */}
              {batchResult && (
                <div className="glass-chip rounded-2xl p-4 flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-white text-sm">Batch Import Results</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                        Total: {batchResult.totalSubmitted}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                        Imported: {batchResult.importedCount}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                        Duplicates Skipped: {batchResult.duplicateCount}
                      </span>
                      {batchResult.invalidCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold">
                          Invalid: {batchResult.invalidCount}
                        </span>
                      )}
                      {batchResult.unavailableCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-300 font-semibold">
                          Unavailable: {batchResult.unavailableCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5 pr-1">
                    {batchResult.items?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="glass rounded-xl p-2.5 flex items-center justify-between text-xs gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${
                              item.status === 'imported'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : item.status.includes('duplicate')
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {item.status.replace('_', ' ')}
                          </span>
                          <span className="truncate text-white/90">
                            {item.title || item.videoId || item.input}
                          </span>
                        </div>
                        <span className="text-white/50 text-[11px] shrink-0">{item.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filter Bar */}
          <div className="glass rounded-[28px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              {/* Anime Filter */}
              <div className="flex items-center gap-1.5 min-w-[180px]">
                <Filter strokeWidth={1.8} className="w-3.5 h-3.5 text-white/50" />
                <select
                  value={filterAnime}
                  onChange={(e) => {
                    setFilterAnime(e.target.value);
                    setEpisodesPage(1);
                  }}
                  className="glass rounded-xl px-2.5 py-1.5 text-xs text-white bg-transparent outline-none w-full"
                >
                  <option value="" className="bg-[#181824] text-white">All Anime</option>
                  {animeOptions.map((a) => (
                    <option key={a.id} value={a.slug} className="bg-[#181824] text-white">
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={filterEpStatus}
                onChange={(e) => {
                  setFilterEpStatus(e.target.value);
                  setEpisodesPage(1);
                }}
                className="glass rounded-xl px-2.5 py-1.5 text-xs text-white bg-transparent outline-none"
              >
                <option value="all" className="bg-[#181824] text-white">All Statuses</option>
                <option value="verified" className="bg-[#181824] text-white">Verified Only</option>
                <option value="unverified" className="bg-[#181824] text-white">Unverified</option>
                <option value="unavailable" className="bg-[#181824] text-white">Unavailable</option>
              </select>

              {/* Language Filter */}
              <select
                value={filterLang}
                onChange={(e) => {
                  setFilterLang(e.target.value);
                  setEpisodesPage(1);
                }}
                className="glass rounded-xl px-2.5 py-1.5 text-xs text-white bg-transparent outline-none"
              >
                <option value="" className="bg-[#181824] text-white">All Languages</option>
                <option value="Hindi" className="bg-[#181824] text-white">Hindi</option>
                <option value="English" className="bg-[#181824] text-white">English</option>
                <option value="Japanese" className="bg-[#181824] text-white">Japanese</option>
              </select>

              {/* Search Box */}
              <div className="relative flex-1 min-w-[160px]">
                <Search strokeWidth={1.8} className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search title or video ID..."
                  value={epSearchQuery}
                  onChange={(e) => {
                    setEpSearchQuery(e.target.value);
                    setEpisodesPage(1);
                  }}
                  className="glass rounded-xl pl-8 pr-3 py-1.5 text-xs text-white bg-transparent outline-none w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/50 self-end md:self-auto shrink-0">
              <span>Showing {episodes.length} of {episodesTotal}</span>
            </div>
          </div>

          {/* Episodes Table */}
          <div className="glass rounded-[32px] p-4 sm:p-6 overflow-hidden">
            {loadingEpisodes ? (
              <div className="flex items-center justify-center py-16 text-white/50 gap-2">
                <RefreshCw strokeWidth={1.8} className="w-5 h-5 animate-spin" />
                <span>Loading episodes...</span>
              </div>
            ) : episodes.length === 0 ? (
              <div className="text-center py-16 text-white/50 text-sm flex flex-col items-center gap-2">
                <Film strokeWidth={1.5} className="w-8 h-8 text-white/30" />
                <span>No episodes found matching the current filters.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-white/80">
                  <thead className="border-b border-white/10 text-white/50 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="pb-3 pl-2">Episode</th>
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Anime</th>
                      <th className="pb-3">Language</th>
                      <th className="pb-3">Video ID</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Published</th>
                      <th className="pb-3">Last Checked</th>
                      <th className="pb-3 text-right pr-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {episodes.map((ep) => (
                      <tr key={ep.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pl-2 font-mono font-bold text-white whitespace-nowrap">
                          S{ep.seasonNumber} E{ep.episodeNumber}
                        </td>
                        <td className="py-3 max-w-[220px]">
                          <div className="flex items-center gap-2.5">
                            {ep.thumbnail ? (
                              <img
                                src={ep.thumbnail}
                                alt=""
                                className="w-12 h-7 rounded object-cover shrink-0 bg-white/5"
                              />
                            ) : (
                              <div className="w-12 h-7 rounded bg-white/5 flex items-center justify-center shrink-0">
                                <Film strokeWidth={1.5} className="w-3.5 h-3.5 text-white/30" />
                              </div>
                            )}
                            <span className="truncate font-medium text-white" title={ep.title}>
                              {ep.title}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 max-w-[140px] truncate text-white/70" title={ep.animeTitle}>
                          {ep.animeTitle}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[11px] font-medium">
                            {ep.audioLanguage}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-[11px]">
                          <a
                            href={`https://www.youtube.com/watch?v=${ep.youtubeVideoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FF8FB4] hover:underline flex items-center gap-1"
                          >
                            <span>{ep.youtubeVideoId}</span>
                            <ExternalLink strokeWidth={1.8} className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              ep.verificationStatus === 'verified'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : ep.verificationStatus === 'unavailable' || ep.verificationStatus === 'deleted' || ep.verificationStatus === 'private'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {ep.verificationStatus}
                          </span>
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleTogglePublish(ep.id, ep.isPublished, ep.verificationStatus)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                              ep.isPublished
                                ? 'bg-[#D81B60]/20 text-[#FF8FB4] hover:bg-[#D81B60]/30'
                                : 'bg-white/10 text-white/50 hover:bg-white/20'
                            }`}
                            title="Click to toggle publication"
                          >
                            {ep.isPublished ? (
                              <>
                                <Eye strokeWidth={1.8} className="w-2.5 h-2.5" />
                                <span>Published</span>
                              </>
                            ) : (
                              <>
                                <EyeOff strokeWidth={1.8} className="w-2.5 h-2.5" />
                                <span>Draft</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 text-[11px] text-white/40 whitespace-nowrap">
                          {ep.lastAvailabilityCheckAt
                            ? new Date(ep.lastAvailabilityCheckAt).toLocaleDateString()
                            : 'Not yet'}
                        </td>
                        <td className="py-3 text-right pr-2 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleVerifySingleEpisode(ep.id)}
                              className="glass p-1.5 rounded-lg text-white/70 hover:text-white transition-all hover:bg-white/10"
                              title="Re-check embed availability via public oEmbed"
                            >
                              <RefreshCw strokeWidth={1.8} className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEpisode(ep.id, ep.title)}
                              className="glass p-1.5 rounded-lg text-rose-300/80 hover:text-rose-200 transition-all hover:bg-rose-500/20"
                              title="Delete episode"
                            >
                              <Trash2 strokeWidth={1.8} className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 0: Manifest Importer */}
      {activeTab === 'manifest' && (
        <div className="glass rounded-[32px] p-6 flex flex-col gap-5 max-w-4xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-[#FF8FB4] px-2.5 py-0.5 rounded-full bg-[#D81B60]/20">
                145 CATALOGUE TITLES
              </span>
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles strokeWidth={1.8} className="w-5 h-5 text-[#FF8FB4]" />
              Official YouTube Catalogue Manifest Importer
            </h2>
            <p className="text-xs text-white/60 mt-1 leading-relaxed">
              Processes the supplied catalogue (Hindi dubs, English dubs, Japanese subbed titles from Muse India, Ani-One India, Pokémon, TMS, Gundam, and VIZ Media). Resolves canonical metadata via AniList, discovers real YouTube candidates, performs embed availability checks, and publishes only strictly verified episodes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Batch Size
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={manifestBatchSize}
                onChange={(e) => setManifestBatchSize(parseInt(e.target.value, 10) || 5)}
                className="glass rounded-xl px-3 py-2 text-sm text-white bg-transparent w-full"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Start Index (0 to 144)
              </label>
              <input
                type="number"
                min="0"
                max="144"
                value={manifestStartIndex}
                onChange={(e) => setManifestStartIndex(parseInt(e.target.value, 10) || 0)}
                className="glass rounded-xl px-3 py-2 text-sm text-white bg-transparent w-full"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Language Filter
              </label>
              <select
                value={manifestFilterLang}
                onChange={(e) => setManifestFilterLang(e.target.value)}
                className="glass rounded-xl px-3 py-2 text-sm text-white bg-[#1A122E] w-full outline-none"
              >
                <option value="">All Languages</option>
                <option value="Hindi">Hindi Dubs</option>
                <option value="English">English Dubs</option>
                <option value="Japanese">Japanese Subbed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Max Videos / Anime
              </label>
              <input
                type="number"
                min="1"
                max="150"
                value={manifestMaxVideos}
                onChange={(e) => setManifestMaxVideos(parseInt(e.target.value, 10) || 25)}
                className="glass rounded-xl px-3 py-2 text-sm text-white bg-transparent w-full"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Resume Job ID (Optional)
              </label>
              <input
                type="text"
                placeholder="job-id-..."
                value={manifestResumeJobId}
                onChange={(e) => setManifestResumeJobId(e.target.value)}
                className="glass rounded-xl px-3 py-2 text-sm text-white bg-transparent w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="autoVerify"
              checked={manifestAutoVerify}
              onChange={(e) => setManifestAutoVerify(e.target.checked)}
              className="accent-[#D81B60] w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="autoVerify" className="text-xs text-white/80 cursor-pointer font-medium">
              Strictly publish candidates meeting all 8 verification criteria (embeddable, authorized channel, language match)
            </label>
          </div>

          <button
            onClick={handleRunManifestImport}
            disabled={importingManifest}
            className="btn-primary w-fit text-sm px-6 gap-2"
          >
            <RefreshCw strokeWidth={1.8} className={`w-4 h-4 ${importingManifest ? 'animate-spin' : ''}`} />
            <span>{importingManifest ? 'Processing Manifest Batch...' : 'Import Manifest Batch'}</span>
          </button>

          {manifestReport && (
            <div className="flex flex-col gap-3 mt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="glass-chip rounded-2xl p-3 text-center">
                  <div className="text-[11px] text-white/50">Processed</div>
                  <div className="text-base font-extrabold text-white mt-0.5">{manifestReport.totalManifestEntriesProcessed}</div>
                </div>
                <div className="glass-chip rounded-2xl p-3 text-center">
                  <div className="text-[11px] text-white/50">Canonical Matched</div>
                  <div className="text-base font-extrabold text-emerald-400 mt-0.5">{manifestReport.matchedCanonicalAnime?.length || 0}</div>
                </div>
                <div className="glass-chip rounded-2xl p-3 text-center">
                  <div className="text-[11px] text-white/50">Candidates Discovered</div>
                  <div className="text-base font-extrabold text-[#FF8FB4] mt-0.5">{manifestReport.realCandidatesDiscoveredCount || 0}</div>
                </div>
                <div className="glass-chip rounded-2xl p-3 text-center">
                  <div className="text-[11px] text-white/50">Episodes Published</div>
                  <div className="text-base font-extrabold text-[#D81B60] mt-0.5">{manifestReport.episodesApprovedAndPublishedCount || 0}</div>
                </div>
              </div>

              <div className="glass-chip rounded-2xl p-4 text-xs font-mono text-white/80 max-h-96 overflow-y-auto whitespace-pre-wrap">
                {JSON.stringify(manifestReport, null, 2)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 1: AniList Metadata Import */}
      {activeTab === 'anilist' && (
        <div className="glass rounded-[32px] p-6 flex flex-col gap-5 max-w-2xl">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles strokeWidth={1.8} className="w-5 h-5 text-[#FF8FB4]" />
              AniList Metadata Importer
            </h2>
            <p className="text-xs text-white/60 mt-1 leading-relaxed">
              Fetches anime metadata from official AniList GraphQL API and upserts into MongoDB. Upserts will not overwrite verified YouTube mappings or existing verification decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Pages to Import (25 anime / page)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={anilistPages}
                onChange={(e) => setAnilistPages(parseInt(e.target.value, 10) || 1)}
                className="glass rounded-xl px-3 py-2 text-sm text-white bg-transparent w-full"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Target Anime Title (Optional search)
              </label>
              <input
                type="text"
                placeholder="e.g. Solo Leveling, One Piece"
                value={anilistSearch}
                onChange={(e) => setAnilistSearch(e.target.value)}
                className="glass rounded-xl px-3 py-2 text-sm text-white bg-transparent w-full"
              />
            </div>
          </div>

          <button
            onClick={handleRunAniListImport}
            disabled={importingAniList}
            className="btn-primary w-fit text-sm px-6 gap-2"
          >
            <RefreshCw strokeWidth={1.8} className={`w-4 h-4 ${importingAniList ? 'animate-spin' : ''}`} />
            <span>{importingAniList ? 'Importing from AniList...' : 'Start AniList Import'}</span>
          </button>

          {anilistResult && (
            <div className="glass-chip rounded-2xl p-4 text-xs font-mono text-white/80 whitespace-pre-wrap">
              {JSON.stringify(anilistResult, null, 2)}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Candidate Discovery & Review */}
      {activeTab === 'candidates' && (
        <div className="flex flex-col gap-6 w-full">
          {/* Discovery Box */}
          <div className="glass rounded-[32px] p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Video strokeWidth={1.8} className="w-5 h-5 text-[#FF8FB4]" />
              Discover Candidate Videos from Official YouTube Channels
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">
                  Search Query / Episode Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Demon Slayer Episode 1"
                  value={discoverQuery}
                  onChange={(e) => setDiscoverQuery(e.target.value)}
                  className="glass rounded-xl px-3 py-2 text-sm text-white bg-transparent w-full"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">
                  Target Anime Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. demon-slayer"
                  value={targetSlug}
                  onChange={(e) => setTargetSlug(e.target.value)}
                  className="glass rounded-xl px-3 py-2 text-sm text-white bg-transparent w-full"
                />
              </div>
            </div>

            <button
              onClick={handleDiscoverCandidates}
              disabled={discovering}
              className="btn-primary w-fit text-sm px-6 gap-2"
            >
              <Search strokeWidth={1.8} className="w-4 h-4" />
              <span>{discovering ? 'Discovering Candidates...' : 'Run Discovery on Official Channels'}</span>
            </button>

            {discoverResult && (
              <div className="glass-chip rounded-xl p-3 text-xs font-mono text-white/80">
                {JSON.stringify(discoverResult)}
              </div>
            )}
          </div>

          {/* Candidate Review Table */}
          <div className="glass rounded-[32px] p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-lg font-bold text-white">Candidates for Verification</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Filter:</span>
                <select
                  value={candidateFilter}
                  onChange={(e) => setCandidateFilter(e.target.value)}
                  className="glass rounded-full px-3 py-1 text-xs text-white bg-[#1A122E] outline-none"
                >
                  <option value="discovered">Discovered</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All</option>
                </select>
                <button
                  onClick={loadCandidates}
                  className="glass-chip p-1.5 rounded-full text-white/70 hover:text-white"
                >
                  <RefreshCw strokeWidth={1.8} className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loadingCandidates ? (
              <div className="text-center py-8 text-white/60 text-sm">Loading candidates...</div>
            ) : candidates.length > 0 ? (
              <div className="flex flex-col gap-3">
                {candidates.map((cand) => (
                  <div
                    key={cand._id}
                    className="glass rounded-[20px] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative w-24 aspect-video rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                        {cand.thumbnailUrl && (
                          <img src={cand.thumbnailUrl} alt={cand.videoTitle} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold text-[#FF8FB4] px-2 py-0.2 rounded-full bg-[#D81B60]/20">
                            {cand.channelTitle}
                          </span>
                          <span className="text-[11px] text-white/50">{cand.claimedLanguage}</span>
                          <span className={`text-[10px] font-semibold uppercase px-2 py-0.2 rounded-full ${
                            cand.verificationStatus === 'verified'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : cand.verificationStatus === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {cand.verificationStatus}
                          </span>
                        </div>
                        <h4 className="text-[13.5px] font-semibold text-white truncate max-w-md">
                          {cand.videoTitle}
                        </h4>
                        <div className="flex items-center gap-2 text-[11.5px] text-white/50 mt-0.5">
                          <span>Target: {cand.candidateAnimeSlug || 'None'}</span>
                          <span>•</span>
                          <a
                            href={`https://youtube.com/watch?v=${cand.youtubeVideoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FF8FB4] hover:underline inline-flex items-center gap-0.5"
                          >
                            YouTube <ExternalLink strokeWidth={1.8} className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {cand.verificationStatus !== 'verified' && (
                        <button
                          onClick={() => handleVerifyCandidate(cand._id, cand.candidateAnimeSlug)}
                          className="btn-primary text-xs px-3.5 py-1.5 h-8 gap-1"
                        >
                          <CheckCircle strokeWidth={1.8} className="w-3.5 h-3.5" />
                          <span>Verify & Publish</span>
                        </button>
                      )}
                      {cand.verificationStatus !== 'rejected' && (
                        <button
                          onClick={() => handleRejectCandidate(cand._id)}
                          className="btn-secondary text-xs px-3 py-1.5 h-8 gap-1"
                        >
                          <XCircle strokeWidth={1.8} className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/50 text-sm">
                No candidates found with status &quot;{candidateFilter}&quot;.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Availability Check */}
      {activeTab === 'availability' && (
        <div className="glass rounded-[32px] p-6 flex flex-col gap-4 max-w-xl">
          <h2 className="text-lg font-bold text-white">Embed Playback Availability Checker</h2>
          <p className="text-xs text-white/60 leading-relaxed">
            Verifies that all currently published YouTube embeds remain playable and have not been removed, set to private, or restricted from external embedding by license holders.
          </p>

          <button
            onClick={handleRunAvailability}
            disabled={checkingAvailability}
            className="btn-primary w-fit text-sm px-6 gap-2"
          >
            <RefreshCw strokeWidth={1.8} className={`w-4 h-4 ${checkingAvailability ? 'animate-spin' : ''}`} />
            <span>{checkingAvailability ? 'Checking Availability...' : 'Run Embed Availability Audit'}</span>
          </button>

          {availabilityResult && (
            <div className="glass-chip rounded-xl p-4 text-xs font-mono text-white/80">
              {JSON.stringify(availabilityResult, null, 2)}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Jobs History */}
      {activeTab === 'jobs' && (
        <div className="glass rounded-[32px] p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <List strokeWidth={1.8} className="w-5 h-5 text-[#FF8FB4]" />
            Pipeline Import Jobs History
          </h2>

          {jobs.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {jobs.map((job) => (
                <div key={job._id} className="glass rounded-xl p-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-white">{job.jobType}</div>
                    <div className="text-white/50">{new Date(job.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/70">
                      Processed: {job.processedCount} | Inserted: {job.insertedCount} | Skipped: {job.skippedCount}
                    </span>
                    <span className={`font-bold uppercase px-2 py-0.5 rounded-full ${
                      job.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : job.status === 'failed'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/50 text-sm">No recorded jobs yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
