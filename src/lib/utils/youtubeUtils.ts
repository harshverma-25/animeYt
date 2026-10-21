export interface YouTubeOEmbedMetadata {
  videoId: string;
  title: string;
  authorName: string;
  authorUrl: string;
  thumbnailUrl: string;
  html?: string;
  isEmbeddable: boolean;
  rawStatus: number;
}

export interface VideoVerificationResult {
  videoId: string;
  isAvailable: boolean;
  isEmbeddable: boolean;
  status: 'verified' | 'unavailable' | 'private' | 'deleted' | 'unverified';
  title?: string;
  authorName?: string;
  thumbnailUrl?: string;
  error?: string;
}

/**
 * Extract an 11-character YouTube video ID from various YouTube URL formats or a raw ID string.
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube-nocookie.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - Raw 11-char ID (e.g. dQw4w9WgXcQ)
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // If directly an 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const urlStr = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');

    // youtu.be/VIDEO_ID
    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0]?.split('?')[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    // youtube.com or youtube-nocookie.com
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      // /watch?v=VIDEO_ID
      const v = parsed.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

      // /embed/VIDEO_ID, /shorts/VIDEO_ID, /live/VIDEO_ID, /v/VIDEO_ID
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && ['embed', 'shorts', 'live', 'v'].includes(parts[0])) {
        const id = parts[1].split('?')[0];
        if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
      }
    }
  } catch {
    // If URL parsing fails, fall back to regex
  }

  // Regex fallback matching standard YouTube URL structures
  const regex = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i;
  const match = trimmed.match(regex);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Normalize any valid YouTube URL or video ID into a canonical YouTube watch URL.
 */
export function normalizeYouTubeUrl(input: string): string | null {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Extract YouTube playlist ID from playlist URL or query string if present.
 */
export function extractPlaylistId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  try {
    const urlStr = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(urlStr);
    const list = parsed.searchParams.get('list');
    if (list) return list;
  } catch {}

  const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Fetch official video metadata using YouTube's authorized, public oEmbed endpoint.
 * Zero API key required, zero quota consumption.
 * NOTE: YouTube oEmbed hangs on HEAD requests, so this ALWAYS uses HTTP GET.
 */
export async function fetchYouTubeOEmbed(videoIdOrUrl: string): Promise<YouTubeOEmbedMetadata | null> {
  const videoId = extractYouTubeVideoId(videoIdOrUrl);
  if (!videoId) return null;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return {
      videoId,
      title: data.title || '',
      authorName: data.author_name || '',
      authorUrl: data.author_url || '',
      thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      html: data.html,
      isEmbeddable: !!data.html,
      rawStatus: res.status,
    };
  } catch {
    return null;
  }
}

/**
 * Check and classify video playback and embedding availability.
 * Distinguishes:
 * - 'verified': public, active, embeddable
 * - 'deleted': 404 response
 * - 'private': 401/403 response (private or embedding disabled)
 * - 'unavailable': not playable
 * - 'unverified': network failure / timeout (cannot confirm)
 */
export async function verifyVideoAvailability(videoIdOrUrl: string): Promise<VideoVerificationResult> {
  const videoId = extractYouTubeVideoId(videoIdOrUrl);
  if (!videoId) {
    return {
      videoId: videoIdOrUrl,
      isAvailable: false,
      isEmbeddable: false,
      status: 'unavailable',
      error: 'Invalid YouTube video ID or URL format',
    };
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    });

    if (res.status === 200) {
      const data = await res.json();
      return {
        videoId,
        isAvailable: true,
        isEmbeddable: true,
        status: 'verified',
        title: data.title || '',
        authorName: data.author_name || '',
        thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }

    if (res.status === 404) {
      return {
        videoId,
        isAvailable: false,
        isEmbeddable: false,
        status: 'deleted',
        error: 'Video not found or has been deleted from YouTube',
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        videoId,
        isAvailable: false,
        isEmbeddable: false,
        status: 'private',
        error: 'Video is private, restricted, or embedding is disabled by the owner',
      };
    }

    return {
      videoId,
      isAvailable: false,
      isEmbeddable: false,
      status: 'unavailable',
      error: `YouTube returned status HTTP ${res.status}`,
    };
  } catch (err) {
    // Never claim verified if check cannot confirm
    return {
      videoId,
      isAvailable: false,
      isEmbeddable: false,
      status: 'unverified',
      error: `Verification connection timed out or failed: ${(err as Error).message}`,
    };
  }
}
