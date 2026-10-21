'use client';
import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export default function AdminPage() {
  const [secretKey, setSecretKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'anilist' | 'candidates' | 'availability' | 'jobs'>('anilist');

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

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-admin-secret': secretKey.trim() || 'animeyt-admin-dev-key',
  });

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
