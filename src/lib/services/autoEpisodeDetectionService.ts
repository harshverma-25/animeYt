import { connectToDatabase } from '@/lib/db/mongodb';
import { Anime } from '@/lib/db/models/Anime';
import { AnimeVersion } from '@/lib/db/models/AnimeVersion';
import { Episode } from '@/lib/db/models/Episode';
import { YouTubeCandidate } from '@/lib/db/models/YouTubeCandidate';
import { SourceChannel } from '@/lib/db/models/SourceChannel';
import { ImportJob } from '@/lib/db/models/ImportJob';
import { ISourceChannel } from '@/types/anime';
import { YouTubeService } from './youtubeService';
import { verifyVideoAvailability } from '@/lib/utils/youtubeUtils';
import { CatalogueService } from './catalogueService';

export interface DiscoveredFeedItem {
  videoId: string;
  title: string;
  description: string;
  publishedAt: Date;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export interface ISourceFeedAdapter {
  fetchFeed(source: ISourceChannel): Promise<DiscoveredFeedItem[]>;
}

/**
 * YouTube Atom Syndication Feed Adapter.
 *
 * Compliance Notice:
 * - Uses YouTube's official public Atom XML feeds (https://www.youtube.com/feeds/videos.xml?channel_id=...).
 * - Requires ZERO YouTube Data API v3 quota or API keys.
 * - Does NOT scrape HTML pages, use internal/private endpoints, or bypass access restrictions.
 * - Suitable for serverless / edge runtime: returns the ~15 most recent uploads per channel.
 */
export class YouTubeAtomFeedAdapter implements ISourceFeedAdapter {
  private maxRetries = 3;
  private timeoutMs = 10000;

  async fetchFeed(source: ISourceChannel): Promise<DiscoveredFeedItem[]> {
    const feedUrl =
      source.feedUrl ||
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(source.channelId)}`;

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(feedUrl, {
          signal: AbortSignal.timeout(this.timeoutMs),
          headers: {
            'User-Agent': 'AnimeYT-FeedReader/1.0 (+https://animeyt.local/syndication)',
            Accept: 'application/atom+xml, application/xml, text/xml',
          },
        });

        if (!response.ok) {
          throw new Error(`Feed request returned HTTP status ${response.status} (${response.statusText})`);
        }

        const xmlText = await response.text();
        return this.parseAtomXml(xmlText, source.channelId, source.channelName);
      } catch (err: any) {
        lastError = err;
        if (attempt < this.maxRetries) {
          // Exponential backoff: 500ms, 1500ms
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        }
      }
    }

    throw lastError || new Error(`Failed to fetch feed for source ${source.channelName}`);
  }

  parseAtomXml(xmlText: string, fallbackChannelId: string, fallbackChannelTitle: string): DiscoveredFeedItem[] {
    const items: DiscoveredFeedItem[] = [];

    // Match each <entry> block
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    let entryMatch: RegExpExecArray | null;

    while ((entryMatch = entryRegex.exec(xmlText)) !== null) {
      const entryContent = entryMatch[1];

      // Extract video ID
      const videoIdMatch = entryContent.match(/<yt:videoId>(.*?)<\/yt:videoId>/i);
      const videoId = videoIdMatch ? videoIdMatch[1].trim() : '';
      if (!videoId) continue;

      // Extract Title
      const titleMatch = entryContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const rawTitle = titleMatch ? titleMatch[1].trim() : 'Untitled';
      const title = this.unescapeXml(rawTitle);

      // Extract Published Date
      const publishedMatch = entryContent.match(/<published>(.*?)<\/published>/i);
      const publishedAt = publishedMatch ? new Date(publishedMatch[1].trim()) : new Date();

      // Extract Description
      const descMatch = entryContent.match(/<media:description[^>]*>([\s\S]*?)<\/media:description>/i);
      const description = descMatch ? this.unescapeXml(descMatch[1].trim()) : '';

      // Extract Thumbnail
      const thumbMatch = entryContent.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
      const thumbnailUrl = thumbMatch
        ? thumbMatch[1].trim()
        : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      // Extract Channel Title if available
      const authorMatch = entryContent.match(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/i);
      const channelTitle = authorMatch ? this.unescapeXml(authorMatch[1].trim()) : fallbackChannelTitle;

      items.push({
        videoId,
        title,
        description,
        publishedAt,
        channelId: fallbackChannelId,
        channelTitle,
        thumbnailUrl,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }

    return items;
  }

  private unescapeXml(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
  }
}

export interface ScanResultMetrics {
  sourcesScanned: number;
  newUploadsDiscovered: number;
  episodesImported: number;
  duplicatesSkipped: number;
  itemsAwaitingReview: number;
  failedCount: number;
  errors: Array<{ channelId: string; channelName: string; error: string }>;
}

export interface ScanOptions {
  sourceId?: string;
  forceAll?: boolean;
  adapter?: ISourceFeedAdapter;
  verifyAvailabilityFn?: (videoId: string) => Promise<{ isAvailable: boolean; isEmbeddable: boolean; status?: string }>;
}

export class AutoEpisodeDetectionService {
  private static defaultAdapter: ISourceFeedAdapter = new YouTubeAtomFeedAdapter();

  /**
   * Parse season and episode number with strict confidence.
   * Does NOT invent episode numbers if ambiguous.
   */
  static parseSeasonAndEpisode(title: string): { seasonNumber: number; episodeNumber: number | null } {
    let seasonNumber = 1;
    let episodeNumber: number | null = null;

    // Detect Season
    const sMatch =
      title.match(/(?:season|s)\s*(\d{1,2})/i) ||
      title.match(/(\d{1,2})(?:st|nd|rd|th)\s+season/i) ||
      title.match(/\bS(\d{1,2})\b/i);

    if (sMatch && sMatch[1]) {
      const parsedS = parseInt(sMatch[1], 10);
      if (!isNaN(parsedS) && parsedS > 0 && parsedS <= 20) {
        seasonNumber = parsedS;
      }
    }

    // Detect Episode
    // Patterns: S2E01, Ep 01, Episode 05, E12, Ep.03, #04
    const epMatch =
      title.match(/(?:s\d+\s*)?(?:ep(?:isode)?\.?\s*|e)(\d{1,4})\b/i) ||
      title.match(/(?:episode|ep)\s*#?\s*(\d{1,4})\b/i) ||
      title.match(/#(\d{1,4})\b/) ||
      title.match(/\[(?:ep(?:isode)?\.?\s*|e)?(\d{1,4})\]/i);

    if (epMatch && epMatch[1]) {
      const parsedEp = parseInt(epMatch[1], 10);
      if (!isNaN(parsedEp) && parsedEp > 0 && parsedEp <= 3000) {
        episodeNumber = parsedEp;
      }
    } else {
      // Look for standalone number bounded by delimiters, e.g. "Title - 01 [Hindi]"
      const standaloneMatch = title.match(/(?:-\s*|\bep\s+)(\d{1,3})\b/i);
      if (standaloneMatch && standaloneMatch[1]) {
        const parsed = parseInt(standaloneMatch[1], 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 3000) {
          episodeNumber = parsed;
        }
      }
    }

    return { seasonNumber, episodeNumber };
  }

  /**
   * Infer audio language strictly between Hindi and English.
   * If ambiguous or other languages (Tamil, Telugu, Japanese, etc.), returns 'Unknown'.
   */
  static inferLanguage(
    title: string,
    sourceLanguages: string[] = [],
    channelTitle = ''
  ): 'Hindi' | 'English' | 'Unknown' {
    const lower = title.toLowerCase();
    const chLower = channelTitle.toLowerCase();

    // Check for other regional dubs that AnimeYT does not currently support
    const unsupportedKeywords = [
      'tamil dub',
      'telugu dub',
      'bengali dub',
      'malayalam dub',
      'kannada dub',
      'japanese',
      'jp dub',
    ];
    for (const kw of unsupportedKeywords) {
      if (lower.includes(kw)) {
        return 'Unknown';
      }
    }

    // Strong Hindi signals
    const hasHindiTag =
      lower.includes('[hindi') ||
      lower.includes('(hindi') ||
      lower.includes('hindi dub') ||
      /\bhindi\b/i.test(lower) ||
      chLower.includes('hindi');

    // Strong English signals
    const hasEnglishTag =
      lower.includes('[eng') ||
      lower.includes('(eng') ||
      lower.includes('english dub') ||
      lower.includes('eng dub') ||
      /\benglish\b/i.test(lower) ||
      chLower.includes('(eng)') ||
      chLower.includes('south asia official (eng)');

    if (hasHindiTag && !hasEnglishTag) {
      return 'Hindi';
    }
    if (hasEnglishTag && !hasHindiTag) {
      return 'English';
    }

    // If title has no explicit language tag, rely on source channel's configured languages
    if (sourceLanguages.length === 1) {
      if (sourceLanguages[0] === 'Hindi') return 'Hindi';
      if (sourceLanguages[0] === 'English') return 'English';
    }

    // Default channels inference
    if (chLower.includes('muse india') || chLower.includes('ani-one india')) {
      return 'Hindi';
    }
    if (chLower.includes('tms') || chLower.includes('viz media') || chLower.includes('pokemon south asia')) {
      return 'English';
    }

    return 'Unknown';
  }

  /**
   * Match upload title against existing Anime records.
   * Sorts candidate anime by title length descending to favor specific matches.
   */
  static matchAnime(
    title: string,
    allAnime: Array<{ _id: any; title: string; englishTitle?: string; romajiTitle?: string; slug: string }>,
    trackedSlugs?: string[]
  ): { _id: any; title: string; slug: string } | null {
    // Filter to tracked slugs if specified
    const pool = trackedSlugs && trackedSlugs.length > 0
      ? allAnime.filter((a) => trackedSlugs.includes(a.slug))
      : allAnime;

    // Clean title for matching: remove bracketed tags and episode patterns
    const cleanTitle = title
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\([^\)]*\)/g, ' ')
      .replace(/(?:season\s*\d+|s\d+)/gi, ' ')
      .replace(/(?:episode\s*\d+|ep\.?\s*\d+|e\d+)/gi, ' ')
      .replace(/#\d+/g, ' ')
      .replace(/[-|–:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    // Sort pool by title length descending
    const sorted = [...pool].sort((a, b) => b.title.length - a.title.length);

    for (const anime of sorted) {
      const candidates = [
        anime.title.toLowerCase(),
        anime.englishTitle?.toLowerCase(),
        anime.romajiTitle?.toLowerCase(),
        anime.slug.replace(/-/g, ' ').toLowerCase(),
      ].filter(Boolean) as string[];

      for (const name of candidates) {
        // Word boundary match
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, 'i');
        if (regex.test(cleanTitle) || cleanTitle.includes(name)) {
          return { _id: anime._id, title: anime.title, slug: anime.slug };
        }
      }
    }

    return null;
  }

  /**
   * Check if upload is a valid full episode (not trailer, shorts, promo, etc.)
   */
  static isValidEpisodeUpload(title: string): boolean {
    if (!YouTubeService.isFullEpisode(title)) {
      return false;
    }

    const lower = title.toLowerCase();
    const extraInvalidKeywords = [
      '#shorts',
      '#short',
      'preview',
      'live stream',
      'livestream',
      'compilation',
      'all in one',
      'season recap',
      'behind the scenes',
      'reaction',
      'review',
      'character promo',
    ];

    for (const kw of extraInvalidKeywords) {
      if (lower.includes(kw)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Run full automatic episode detection across all enabled sources.
   * Prevents concurrent duplicate runs via job lock.
   */
  static async runFullScan(options: ScanOptions = {}): Promise<ScanResultMetrics & { jobId: string; skipped?: boolean; reason?: string }> {
    await connectToDatabase();

    // Concurrency Lock: check for running automatic_episode_detection job started within last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeJob = await ImportJob.findOne({
      dataSource: 'youtube',
      jobType: 'automatic_episode_detection',
      status: 'running',
      startedAt: { $gte: fiveMinutesAgo },
    });

    if (activeJob) {
      return {
        jobId: activeJob._id.toString(),
        skipped: true,
        reason: 'Automatic episode detection job is already running',
        sourcesScanned: 0,
        newUploadsDiscovered: 0,
        episodesImported: 0,
        duplicatesSkipped: 0,
        itemsAwaitingReview: 0,
        failedCount: 0,
        errors: [],
      };
    }

    // Create new ImportJob record
    const job = await ImportJob.create({
      dataSource: 'youtube',
      jobType: 'automatic_episode_detection',
      status: 'running',
      startedAt: new Date(),
      progress: 0,
      processedCount: 0,
      insertedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
    });

    const metrics: ScanResultMetrics = {
      sourcesScanned: 0,
      newUploadsDiscovered: 0,
      episodesImported: 0,
      duplicatesSkipped: 0,
      itemsAwaitingReview: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      // Find sources to scan
      const sourceQuery: any = { isEnabled: true };
      if (options.sourceId) {
        sourceQuery._id = options.sourceId;
      }
      const sources = await SourceChannel.find(sourceQuery);

      if (sources.length === 0) {
        job.status = 'completed';
        job.completedAt = new Date();
        job.progress = 100;
        await job.save();
        return { ...metrics, jobId: job._id.toString() };
      }

      // Pre-load all anime for in-memory fast matching
      const allAnime = await Anime.find(
        {},
        { _id: 1, title: 1, englishTitle: 1, romajiTitle: 1, slug: 1 }
      ).lean();

      const adapter = options.adapter || this.defaultAdapter;

      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        source.lastAttemptedCheckAt = new Date();

        try {
          const feedItems = await adapter.fetchFeed(source);
          metrics.sourcesScanned++;
          metrics.newUploadsDiscovered += feedItems.length;

          // Process each discovered item
          for (const item of feedItems) {
            await this.processFeedItem(item, source, allAnime, metrics, options.verifyAvailabilityFn);
          }

          source.lastSuccessfulCheckAt = new Date();
          source.lastError = undefined;
          await source.save();
        } catch (err: any) {
          metrics.failedCount++;
          const errorMsg = err.message || 'Unknown feed error';
          source.lastError = errorMsg;
          await source.save();
          metrics.errors.push({
            channelId: source.channelId,
            channelName: source.channelName,
            error: errorMsg,
          });
        }

        // Polite delay between sources to avoid burst requests
        if (i < sources.length - 1) {
          await new Promise((r) => setTimeout(r, 300));
        }

        // Update job progress
        job.progress = Math.round(((i + 1) / sources.length) * 100);
        job.processedCount = metrics.newUploadsDiscovered;
        job.insertedCount = metrics.episodesImported;
        job.skippedCount = metrics.duplicatesSkipped;
        job.failedCount = metrics.failedCount;
        await job.save();
      }

      job.status = 'completed';
      job.completedAt = new Date();
      job.progress = 100;
      if (metrics.errors.length > 0) {
        job.errorSummary = `${metrics.errors.length} sources encountered errors: ${metrics.errors.map((e) => e.channelName).join(', ')}`;
      }
      await job.save();

      // Clear catalogue cache if new episodes were imported
      if (metrics.episodesImported > 0) {
        CatalogueService.clearCache();
      }

      return { ...metrics, jobId: job._id.toString() };
    } catch (fatalErr: any) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.errorSummary = fatalErr.message || 'Fatal error during scan execution';
      await job.save();
      throw fatalErr;
    }
  }

  /**
   * Process a single discovered upload item.
   * If confident, auto-publishes. If uncertain, queues for admin review.
   */
  private static async processFeedItem(
    item: DiscoveredFeedItem,
    source: ISourceChannel,
    allAnime: any[],
    metrics: ScanResultMetrics,
    verifyAvailabilityFn?: (videoId: string) => Promise<{ isAvailable: boolean; isEmbeddable: boolean; status?: string }>
  ) {
    // 1. Check if episode already exists by video ID
    const existingEpisode = await Episode.findOne({ youtubeVideoId: item.videoId });
    if (existingEpisode && existingEpisode.isPublished) {
      metrics.duplicatesSkipped++;
      return;
    }

    // 2. Reject trailers, shorts, clips, promos
    if (!this.isValidEpisodeUpload(item.title)) {
      return;
    }

    // 3. Match Anime
    const matchedAnime = this.matchAnime(item.title, allAnime, source.trackedAnimeSlugs);
    const { seasonNumber, episodeNumber } = this.parseSeasonAndEpisode(item.title);
    const language = this.inferLanguage(item.title, source.languages, source.channelName);

    // 4. Determine Confidence & Publication Eligibility
    const hasConfidentAnime = !!matchedAnime;
    const hasConfidentEpisode = episodeNumber !== null && episodeNumber > 0;
    const hasConfidentLanguage = language === 'Hindi' || language === 'English';
    const isSourceVerified = source.officialSourceVerificationStatus === 'verified';

    // Check availability via oEmbed
    let isEmbeddable = false;
    let availabilityCheckNotes = '';
    try {
      const checker = verifyAvailabilityFn || verifyVideoAvailability;
      const avail = await checker(item.videoId);
      isEmbeddable = avail.isAvailable && avail.isEmbeddable;
      if (!isEmbeddable) {
        availabilityCheckNotes = `oEmbed verification indicated unavailable or restricted (status: ${avail.status})`;
      }
    } catch (e: any) {
      isEmbeddable = false;
      availabilityCheckNotes = `oEmbed verification check failed: ${e.message}`;
    }

    const canAutoPublish =
      hasConfidentAnime &&
      hasConfidentEpisode &&
      hasConfidentLanguage &&
      isSourceVerified &&
      isEmbeddable;

    if (canAutoPublish && matchedAnime && episodeNumber !== null) {
      // Check for conflicting video ID mapping to another anime
      const conflict = await Episode.findOne({
        youtubeVideoId: item.videoId,
        anime: { $ne: matchedAnime._id },
      });
      if (conflict) {
        // Queue for review with conflict warning
        await this.queueForReview(
          item,
          source,
          matchedAnime,
          seasonNumber,
          episodeNumber,
          language,
          `Conflict detected: Video ID ${item.videoId} is already mapped to anime ID ${conflict.anime}`
        );
        metrics.itemsAwaitingReview++;
        return;
      }

      // Resolve or create AnimeVersion
      let version = await AnimeVersion.findOne({
        anime: matchedAnime._id,
        audioLanguage: language,
      });

      if (!version) {
        version = await AnimeVersion.create({
          anime: matchedAnime._id,
          audioLanguage: language,
          languageCode: language === 'Hindi' ? 'hi' : 'en',
          channelName: source.channelName,
          sourceChannel: source._id,
          verificationStatus: 'verified',
          verifiedAt: new Date(),
          verificationNotes: 'Auto-created by Automatic Episode Detection',
        });
      }

      // Upsert published Episode
      const existingEpByNum = await Episode.findOne({
        version: version._id,
        seasonNumber,
        episodeNumber,
      });

      if (existingEpByNum && existingEpByNum.youtubeVideoId !== item.videoId) {
        // Another video ID is already assigned to this episode number
        await this.queueForReview(
          item,
          source,
          matchedAnime,
          seasonNumber,
          episodeNumber,
          language,
          `Duplicate episode number detected: S${seasonNumber}E${episodeNumber} already has video ID ${existingEpByNum.youtubeVideoId}`
        );
        metrics.itemsAwaitingReview++;
        return;
      }

      const epQuery = existingEpByNum
        ? { _id: existingEpByNum._id }
        : { version: version._id, seasonNumber, episodeNumber };

      const episode = await Episode.findOneAndUpdate(
        epQuery,
        {
          $set: {
            anime: matchedAnime._id,
            version: version._id,
            seasonNumber,
            episodeNumber,
            title: item.title,
            youtubeVideoId: item.videoId,
            videoUrl: item.videoUrl,
            publicationDate: item.publishedAt,
            verificationStatus: 'verified',
            isPublished: true,
            isEmbeddable: true,
            thumbnail: item.thumbnailUrl,
            sourceChannelName: source.channelName,
            sourceChannelId: source.channelId,
            languageCode: language === 'Hindi' ? 'hi' : 'en',
            verifiedAt: new Date(),
            verifiedBy: 'system_auto_detection',
            verificationNotes: 'Auto-published by Automatic Episode Detection',
            lastAvailabilityCheckAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after' }
      );

      // Create/update YouTubeCandidate record as verified
      await YouTubeCandidate.findOneAndUpdate(
        { youtubeVideoId: item.videoId },
        {
          $set: {
            channelId: source.channelId,
            channelTitle: source.channelName,
            videoTitle: item.title,
            videoDescription: item.description,
            thumbnailUrl: item.thumbnailUrl,
            candidateAnimeId: matchedAnime._id,
            candidateAnimeSlug: matchedAnime.slug,
            candidateEpisodeNumber: episodeNumber,
            candidateSeasonNumber: seasonNumber,
            claimedLanguage: language,
            discoveryMethod: 'atom_feed',
            verificationStatus: 'verified',
            publishedEpisodeId: episode._id,
            reviewedBy: 'system_auto_detection',
            reviewedAt: new Date(),
            reviewerNotes: 'Auto-published: confident anime, episode, language, and oEmbed verification',
            lastAvailabilityCheckAt: new Date(),
          },
        },
        { upsert: true }
      );

      // Update Anime verifiedEpisodeCount
      const verifiedCount = await Episode.countDocuments({
        anime: matchedAnime._id,
        verificationStatus: 'verified',
        isPublished: true,
      });

      await Anime.updateOne(
        { _id: matchedAnime._id },
        { $set: { verifiedEpisodeCount: verifiedCount } }
      );

      metrics.episodesImported++;
    } else {
      // Reason for review
      const reviewReasons: string[] = [];
      if (!hasConfidentAnime) reviewReasons.push('Anime match could not be determined with high confidence');
      if (!hasConfidentEpisode) reviewReasons.push('Episode number could not be reliably extracted');
      if (!hasConfidentLanguage) reviewReasons.push(`Language is ambiguous or not Hindi/English (${language})`);
      if (!isSourceVerified) reviewReasons.push('Source channel is not yet officially verified');
      if (!isEmbeddable) reviewReasons.push(availabilityCheckNotes || 'oEmbed playback check did not pass');

      await this.queueForReview(
        item,
        source,
        matchedAnime,
        seasonNumber,
        episodeNumber,
        language,
        reviewReasons.join('; ')
      );
      metrics.itemsAwaitingReview++;
    }
  }

  /**
   * Queue an ambiguous or unverified upload to YouTubeCandidate for administrator review
   */
  private static async queueForReview(
    item: DiscoveredFeedItem,
    source: ISourceChannel,
    matchedAnime: { _id: any; slug: string } | null,
    seasonNumber: number,
    episodeNumber: number | null,
    language: string,
    reviewReason: string
  ) {
    await YouTubeCandidate.findOneAndUpdate(
      { youtubeVideoId: item.videoId },
      {
        $setOnInsert: {
          youtubeVideoId: item.videoId,
          channelId: source.channelId,
          channelTitle: source.channelName,
          videoTitle: item.title,
          videoDescription: item.description,
          thumbnailUrl: item.thumbnailUrl,
          candidateAnimeId: matchedAnime?._id,
          candidateAnimeSlug: matchedAnime?.slug,
          candidateEpisodeNumber: episodeNumber || 1,
          candidateSeasonNumber: seasonNumber || 1,
          claimedLanguage: language === 'Unknown' ? 'Hindi' : language,
          discoveryMethod: 'atom_feed',
          verificationStatus: 'pending_review',
          reviewerNotes: reviewReason,
          lastAvailabilityCheckAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  /**
   * Seed/sync standard official source channels with their feed URLs and languages
   */
  static async syncDefaultSources(): Promise<{ updated: number }> {
    await connectToDatabase();

    const defaultSources: Array<{
      channelId: string;
      channelName: string;
      customUrl: string;
      feedUrl: string;
      languages: string[];
      isEnabled: boolean;
    }> = [
      {
        channelId: 'UCYYhAzgWuxPauRXdPpLAX3Q',
        channelName: 'Muse India',
        customUrl: 'https://youtube.com/@MuseIndiaChannel',
        feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCYYhAzgWuxPauRXdPpLAX3Q',
        languages: ['Hindi'],
        isEnabled: true,
      },
      {
        channelId: 'UC67pLBZ_z4Gd46t6mW7uHjA',
        channelName: 'Ani-One India',
        customUrl: 'https://youtube.com/@AniOneIN',
        feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC67pLBZ_z4Gd46t6mW7uHjA',
        languages: ['Hindi'],
        isEnabled: true,
      },
      {
        channelId: 'UCm1hOHNgH6x8MF22676CmZA',
        channelName: 'Pokémon Asia Official (Hindi)',
        customUrl: 'https://youtube.com/@pokemonasiahindiofficial',
        feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCm1hOHNgH6x8MF22676CmZA',
        languages: ['Hindi'],
        isEnabled: true,
      },
      {
        channelId: 'UCkw5zHqcBTX-Udq8pQ-xGBA',
        channelName: 'Pokémon South Asia Official (ENG)',
        customUrl: 'https://youtube.com/channel/UCkw5zHqcBTX-Udq8pQ-xGBA',
        feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCkw5zHqcBTX-Udq8pQ-xGBA',
        languages: ['English'],
        isEnabled: true,
      },
      {
        channelId: 'UCzGf0DdUJVrsbcWL3e_tK1Q',
        channelName: 'Anime! on TMS Official Channel',
        customUrl: 'https://youtube.com/@animeontmsofficialchannel',
        feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCzGf0DdUJVrsbcWL3e_tK1Q',
        languages: ['English'],
        isEnabled: true,
      },
      {
        channelId: 'UCV1da9peoqEwqr45bpTJsbQ',
        channelName: 'VIZ Media',
        customUrl: 'https://youtube.com/@VIZMedia',
        feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCV1da9peoqEwqr45bpTJsbQ',
        languages: ['English'],
        isEnabled: true,
      },
    ];

    let updated = 0;
    for (const src of defaultSources) {
      await SourceChannel.findOneAndUpdate(
        { channelId: src.channelId },
        {
          $set: {
            channelName: src.channelName,
            customUrl: src.customUrl,
            sourceUrl: src.customUrl,
            feedUrl: src.feedUrl,
            languages: src.languages,
            officialSourceVerificationStatus: 'verified',
            isEnabled: src.isEnabled,
          },
        },
        { upsert: true }
      );
      updated++;
    }

    return { updated };
  }

  /**
   * Get latest scan observability summary
   */
  static async getObservabilitySummary() {
    await connectToDatabase();

    const lastJob = await ImportJob.findOne({
      dataSource: 'youtube',
      jobType: 'automatic_episode_detection',
    }).sort({ createdAt: -1 });

    const sources = await SourceChannel.find({ isEnabled: true })
      .select('channelId channelName languages lastSuccessfulCheckAt lastAttemptedCheckAt lastError isEnabled')
      .lean();

    const pendingReviewCount = await YouTubeCandidate.countDocuments({
      verificationStatus: 'pending_review',
    });

    const recentAutoEpisodes = await Episode.find({
      verifiedBy: 'system_auto_detection',
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('anime', 'title slug')
      .lean();

    return {
      lastJob: lastJob
        ? {
          id: lastJob._id.toString(),
          status: lastJob.status,
          startedAt: lastJob.startedAt,
          completedAt: lastJob.completedAt,
          processedCount: lastJob.processedCount,
          insertedCount: lastJob.insertedCount,
          skippedCount: lastJob.skippedCount,
          failedCount: lastJob.failedCount,
          errorSummary: lastJob.errorSummary,
        }
        : null,
      sources,
      pendingReviewCount,
      recentAutoEpisodes,
    };
  }
}
