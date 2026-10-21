export interface YouTubeVideoItem {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  playlistId?: string;
  position?: number;
}

interface RawYouTubeApiItem {
  id?: { videoId?: string };
  contentDetails?: { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    channelId?: string;
    channelTitle?: string;
    position?: number;
    resourceId?: { videoId?: string };
    thumbnails?: {
      high?: { url?: string };
      default?: { url?: string };
    };
  };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory server-side cache for YouTube responses to protect quota
const responseCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache

import {
  extractYouTubeVideoId,
  normalizeYouTubeUrl,
  extractPlaylistId,
  fetchYouTubeOEmbed,
  verifyVideoAvailability,
  YouTubeOEmbedMetadata,
  VideoVerificationResult,
} from '@/lib/utils/youtubeUtils';

export class YouTubeService {
  private static getApiKey(): string | null {
    return process.env.YOUTUBE_API_KEY || null;
  }

  /**
   * Check if YouTube integration is configured.
   * AnimeYT operates without the YouTube Data API key via public oEmbed and batch management.
   */
  static isConfigured(): boolean {
    return true;
  }

  /**
   * Check if optional legacy YouTube Data API v3 key is provided
   */
  static hasDataApiKey(): boolean {
    return !!this.getApiKey();
  }

  /**
   * Extract 11-char YouTube Video ID from any URL format or raw ID
   */
  static extractVideoId(input: string): string | null {
    return extractYouTubeVideoId(input);
  }

  /**
   * Normalize any YouTube URL or ID to standard watch URL
   */
  static normalizeUrl(input: string): string | null {
    return normalizeYouTubeUrl(input);
  }

  /**
   * Extract playlist ID if provided
   */
  static extractPlaylistId(input: string): string | null {
    return extractPlaylistId(input);
  }

  /**
   * Fetch official video metadata without API key via public oEmbed
   */
  static async fetchOEmbed(videoIdOrUrl: string): Promise<YouTubeOEmbedMetadata | null> {
    return fetchYouTubeOEmbed(videoIdOrUrl);
  }

  /**
   * Check video playback/embed availability and status
   */
  static async verifyAvailability(videoIdOrUrl: string): Promise<VideoVerificationResult> {
    return verifyVideoAvailability(videoIdOrUrl);
  }

  /**
   * Fetch playlist items from YouTube Data API v3 with multi-page support
   */
  static async fetchPlaylistVideos(
    playlistId: string,
    maxResults = 50,
    fetchAllPages = false
  ): Promise<{
    videos: YouTubeVideoItem[];
    error?: string;
  }> {
    const apiKey = this.getApiKey();
    const cacheKey = `playlist_${playlistId}_${maxResults}_${fetchAllPages}`;

    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as { videos: YouTubeVideoItem[] };
    }

    if (!apiKey) {
      return {
        videos: [],
        error:
          'YouTube API key is not configured. Set YOUTUBE_API_KEY in environment to enable real YouTube discovery imports.',
      };
    }

    try {
      const allVideos: YouTubeVideoItem[] = [];
      let pageToken: string | undefined = undefined;
      let pagesFetched = 0;
      const maxPages = fetchAllPages ? 5 : 1;

      do {
        const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
        url.searchParams.set('part', 'snippet,contentDetails');
        url.searchParams.set('playlistId', playlistId);
        url.searchParams.set('maxResults', Math.min(maxResults, 50).toString());
        url.searchParams.set('key', apiKey);
        if (pageToken) url.searchParams.set('pageToken', pageToken);

        const res = await fetch(url.toString(), {
          next: { revalidate: 1800 },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const reason = errorData.error?.errors?.[0]?.reason || '';
          const message =
            errorData.error?.message || `YouTube API returned HTTP status ${res.status}`;
          const formatted =
            reason === 'quotaExceeded' ? `YouTube API quota exceeded: ${message}` : message;
          if (allVideos.length > 0) break;
          return { videos: [], error: formatted };
        }

        const data = await res.json();
        const items: YouTubeVideoItem[] = (data.items || [])
          .filter((item: RawYouTubeApiItem) => {
            const title = item.snippet?.title || '';
            return title !== 'Private video' && title !== 'Deleted video';
          })
          .map((item: RawYouTubeApiItem) => ({
            videoId: item.contentDetails?.videoId || item.snippet?.resourceId?.videoId || '',
            title: item.snippet?.title || 'Untitled',
            description: item.snippet?.description || '',
            publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
            thumbnailUrl:
              item.snippet?.thumbnails?.high?.url ||
              item.snippet?.thumbnails?.default?.url ||
              `https://img.youtube.com/vi/${item.contentDetails?.videoId}/hqdefault.jpg`,
            channelId: item.snippet?.channelId || '',
            channelTitle: item.snippet?.channelTitle || '',
            playlistId,
            position: item.snippet?.position,
          }))
          .filter((v: YouTubeVideoItem) => !!v.videoId);

        allVideos.push(...items);
        pageToken = data.nextPageToken;
        pagesFetched++;
      } while (fetchAllPages && pageToken && pagesFetched < maxPages);

      const result = { videos: allVideos };
      responseCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (err) {
      console.error('Failed to fetch YouTube playlist:', err);
      return { videos: [], error: (err as Error).message };
    }
  }

  /**
   * Search playlists on an approved channel
   */
  static async searchPlaylists(
    channelId: string,
    query: string,
    maxResults = 5
  ): Promise<{
    playlists: Array<{ playlistId: string; title: string; description: string }>;
    error?: string;
  }> {
    const apiKey = this.getApiKey();
    const cacheKey = `playlists_search_${channelId}_${query}_${maxResults}`;

    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as { playlists: Array<{ playlistId: string; title: string; description: string }> };
    }

    if (!apiKey) {
      return { playlists: [], error: 'YouTube API key is not configured.' };
    }

    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('channelId', channelId);
      url.searchParams.set('q', query);
      url.searchParams.set('type', 'playlist');
      url.searchParams.set('maxResults', maxResults.toString());
      url.searchParams.set('key', apiKey);

      const res = await fetch(url.toString(), {
        next: { revalidate: 1800 },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const reason = errorData.error?.errors?.[0]?.reason || '';
        const message = errorData.error?.message || `YouTube API returned HTTP status ${res.status}`;
        const formatted = reason === 'quotaExceeded' ? `YouTube API quota exceeded: ${message}` : message;
        return { playlists: [], error: formatted };
      }

      const data = await res.json();
      const items = (data.items || []).map((item: any) => ({
        playlistId: item.id?.playlistId || '',
        title: item.snippet?.title || '',
        description: item.snippet?.description || '',
      })).filter((p: any) => !!p.playlistId);

      const result = { playlists: items };
      responseCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (err) {
      return { playlists: [], error: (err as Error).message };
    }
  }

  /**
   * Search videos inside a specific approved official channel
   */
  static async searchChannelVideos(
    channelId: string,
    query: string,
    maxResults = 20
  ): Promise<{
    videos: YouTubeVideoItem[];
    error?: string;
  }> {
    const apiKey = this.getApiKey();
    const cacheKey = `search_${channelId}_${query}_${maxResults}`;

    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as { videos: YouTubeVideoItem[] };
    }

    if (!apiKey) {
      return {
        videos: [],
        error:
          'YouTube API key is not configured. Set YOUTUBE_API_KEY in environment to enable channel search.',
      };
    }

    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('channelId', channelId);
      url.searchParams.set('q', query);
      url.searchParams.set('type', 'video');
      url.searchParams.set('maxResults', maxResults.toString());
      url.searchParams.set('key', apiKey);

      const res = await fetch(url.toString(), {
        next: { revalidate: 1800 },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const reason = errorData.error?.errors?.[0]?.reason || '';
        const message =
          errorData.error?.message || `YouTube API returned HTTP status ${res.status}`;
        const formatted =
          reason === 'quotaExceeded' ? `YouTube API quota exceeded: ${message}` : message;
        return { videos: [], error: formatted };
      }

      const data = await res.json();
      const items: YouTubeVideoItem[] = (data.items || []).map((item: RawYouTubeApiItem) => ({
        videoId: item.id?.videoId || '',
        title: item.snippet?.title || 'Untitled',
        description: item.snippet?.description || '',
        publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
        thumbnailUrl:
          item.snippet?.thumbnails?.high?.url ||
          `https://img.youtube.com/vi/${item.id?.videoId}/hqdefault.jpg`,
        channelId: item.snippet?.channelId || channelId,
        channelTitle: item.snippet?.channelTitle || '',
      }));

      const result = { videos: items };
      responseCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (err) {
      return { videos: [], error: (err as Error).message };
    }
  }

  /**
   * Determine if a video is a legitimate full episode rather than a trailer, clip, teaser, or promo
   */
  static isFullEpisode(title: string): boolean {
    const lower = title.toLowerCase();

    const nonEpisodeKeywords = [
      'trailer',
      'teaser',
      'preview',
      'pv',
      'clip',
      'short',
      'shorts',
      'recap',
      'opening',
      'ending',
      'ost',
      'soundtrack',
      'special announcement',
      'highlights',
      'best moments',
      'movie announcement',
      'press conference',
    ];

    for (const kw of nonEpisodeKeywords) {
      const regex = new RegExp(`(?:\\b|_|\\W)${kw}(?:\\b|_|\\W)`, 'i');
      if (regex.test(lower)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Extract season number from title
   * e.g. "Season 2", "S2", "2nd Season", "Season 03"
   */
  static parseSeasonNumber(title: string): number {
    const sMatch =
      title.match(/(?:season|s)\s*(\d+)/i) ||
      title.match(/(\d+)(?:st|nd|rd|th)\s+season/i) ||
      title.match(/\bS(\d+)\b/i);

    if (sMatch && sMatch[1]) {
      const parsed = parseInt(sMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
        return parsed;
      }
    }
    return 1;
  }

  /**
   * Helper to parse episode number from common YouTube video title formats
   * e.g. "Episode 01", "Ep. 1", "E01", "[Hindi Dub] Ep 3", "01"
   */
  static parseEpisodeNumber(title: string, fallbackPosition?: number): number {
    const epMatch =
      title.match(/(?:ep(?:isode)?\.?\s*|e)(\d{1,4})/i) ||
      title.match(/(?:episode|ep)\s*#?\s*(\d{1,4})/i) ||
      title.match(/#(\d{1,4})\b/);

    if (epMatch && epMatch[1]) {
      const parsed = parseInt(epMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0 && parsed < 2000) {
        return parsed;
      }
    }

    const numMatch = title.match(/\b(0?[1-9]\d?)\b/);
    if (numMatch && numMatch[1]) {
      const parsed = parseInt(numMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0 && parsed < 2000) {
        return parsed;
      }
    }

    if (fallbackPosition !== undefined && fallbackPosition >= 0) {
      return fallbackPosition + 1;
    }

    return 1;
  }
}
