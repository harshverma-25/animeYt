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

export class YouTubeService {
  private static getApiKey(): string | null {
    return process.env.YOUTUBE_API_KEY || null;
  }

  /**
   * Check if YouTube API is configured
   */
  static isConfigured(): boolean {
    return !!this.getApiKey();
  }

  /**
   * Fetch playlist items from YouTube Data API v3
   */
  static async fetchPlaylistVideos(
    playlistId: string,
    maxResults = 25
  ): Promise<{
    videos: YouTubeVideoItem[];
    error?: string;
    isSimulated?: boolean;
  }> {
    const apiKey = this.getApiKey();
    const cacheKey = `playlist_${playlistId}_${maxResults}`;

    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as { videos: YouTubeVideoItem[] };
    }

    if (!apiKey) {
      return {
        videos: [],
        error:
          'YouTube API key is not configured. Set YOUTUBE_API_KEY in .env.local to enable real YouTube discovery imports.',
        isSimulated: true,
      };
    }

    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      url.searchParams.set('part', 'snippet,contentDetails');
      url.searchParams.set('playlistId', playlistId);
      url.searchParams.set('maxResults', maxResults.toString());
      url.searchParams.set('key', apiKey);

      const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message =
          errorData.error?.message || `YouTube API returned HTTP status ${res.status}`;
        console.error('YouTube API Playlist error:', message);
        return { videos: [], error: message };
      }

      const data = await res.json();
      const items: YouTubeVideoItem[] = (data.items || []).map((item: RawYouTubeApiItem) => ({
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
      }));

      const result = { videos: items };
      responseCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (err) {
      console.error('Failed to fetch YouTube playlist:', err);
      return { videos: [], error: (err as Error).message };
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
    isSimulated?: boolean;
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
          'YouTube API key is not configured. Set YOUTUBE_API_KEY in .env.local to enable channel search.',
        isSimulated: true,
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

      const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message =
          errorData.error?.message || `YouTube API returned HTTP status ${res.status}`;
        return { videos: [], error: message };
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
   * Helper to parse episode number from common YouTube video title formats
   * e.g. "Episode 01", "Ep. 1", "E01", "[Hindi Dub] Ep 3", "01"
   */
  static parseEpisodeNumber(title: string): number {
    const epMatch =
      title.match(/(?:ep(?:isode)?\.?\s*|e)(\d+)/i) ||
      title.match(/#(\d+)/) ||
      title.match(/\b(\d{1,3})\b/);
    if (epMatch && epMatch[1]) {
      const parsed = parseInt(epMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0 && parsed < 2000) {
        return parsed;
      }
    }
    return 1;
  }
}
