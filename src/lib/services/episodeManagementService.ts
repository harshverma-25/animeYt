import { connectToDatabase } from '@/lib/db/mongodb';
import { Anime } from '@/lib/db/models/Anime';
import { AnimeVersion } from '@/lib/db/models/AnimeVersion';
import { Episode } from '@/lib/db/models/Episode';
import { YouTubeCandidate } from '@/lib/db/models/YouTubeCandidate';
import { CatalogueService } from './catalogueService';
import { YouTubeService } from './youtubeService';
import {
  extractYouTubeVideoId,
  fetchYouTubeOEmbed,
  verifyVideoAvailability,
  VideoVerificationResult,
} from '@/lib/utils/youtubeUtils';

export interface CreateEpisodeInput {
  animeSlugOrId: string;
  audioLanguage: string;
  seasonNumber?: number;
  episodeNumber: number;
  youtubeUrlOrId: string;
  title?: string;
  thumbnail?: string;
  duration?: string;
  isPublished?: boolean;
  verificationStatus?: 'verified' | 'unverified' | 'pending_review';
  reviewerNotes?: string;
  reviewerName?: string;
}

export interface UpdateEpisodeInput {
  title?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  audioLanguage?: string;
  youtubeUrlOrId?: string;
  thumbnail?: string;
  duration?: string;
  isPublished?: boolean;
  verificationStatus?: 'verified' | 'unverified' | 'unavailable' | 'rejected';
  reviewerNotes?: string;
  reviewerName?: string;
}

export interface BatchImportInput {
  animeSlugOrId: string;
  audioLanguage: string;
  seasonNumber?: number;
  videoInputs: string[] | string;
  autoVerify?: boolean;
  playlistId?: string;
  reviewerName?: string;
}

export interface BatchImportReportItem {
  input: string;
  videoId?: string;
  title?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  status: 'imported' | 'duplicate_video' | 'duplicate_episode' | 'invalid_url' | 'unavailable' | 'candidate_created';
  message: string;
}

export interface BatchImportResult {
  totalSubmitted: number;
  importedCount: number;
  duplicateCount: number;
  invalidCount: number;
  unavailableCount: number;
  items: BatchImportReportItem[];
}

export class EpisodeManagementService {
  /**
   * Helper to resolve target Anime by slug or ObjectId
   */
  static async resolveAnime(animeSlugOrId: string) {
    await connectToDatabase();
    const query = /^[0-9a-fA-F]{24}$/.test(animeSlugOrId)
      ? { $or: [{ _id: animeSlugOrId }, { slug: animeSlugOrId.toLowerCase() }] }
      : { slug: animeSlugOrId.toLowerCase() };

    const anime = await Anime.findOne(query);
    if (!anime) {
      throw new Error(`Anime not found for identifier "${animeSlugOrId}"`);
    }
    return anime;
  }

  /**
   * Helper to find or create AnimeVersion
   */
  static async resolveOrCreateVersion(animeId: any, audioLanguage: string, defaultChannelName = 'Official Channel') {
    let version = await AnimeVersion.findOne({
      anime: animeId,
      audioLanguage: { $regex: new RegExp(`^${audioLanguage.trim()}$`, 'i') },
    });

    if (!version) {
      const normalizedLang = audioLanguage.trim();
      const code = normalizedLang.toLowerCase().slice(0, 2);
      version = await AnimeVersion.create({
        anime: animeId,
        audioLanguage: normalizedLang,
        languageCode: code,
        channelName: defaultChannelName,
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verificationNotes: `Created via episode management workflow for ${normalizedLang}`,
      });
    }

    return version;
  }

  /**
   * Helper to recalculate verifiedEpisodeCount on Anime and invalidate caches
   */
  static async recalculateAndInvalidate(animeId: any) {
    const count = await Episode.countDocuments({
      anime: animeId,
      verificationStatus: 'verified',
      isPublished: true,
    });
    await Anime.updateOne({ _id: animeId }, { $set: { verifiedEpisodeCount: count } });
    CatalogueService.clearCache();
    return count;
  }

  /**
   * Create and validate a single episode
   */
  static async createEpisode(input: CreateEpisodeInput) {
    await connectToDatabase();

    const anime = await this.resolveAnime(input.animeSlugOrId);
    const audioLanguage = (input.audioLanguage || 'Japanese').trim();
    const seasonNumber = input.seasonNumber ? Math.max(1, Math.floor(input.seasonNumber)) : 1;
    const episodeNumber = Math.floor(input.episodeNumber);

    if (isNaN(episodeNumber) || episodeNumber < 1) {
      throw new Error(`Invalid episode number: ${input.episodeNumber}. Must be a positive integer.`);
    }

    // Validate and normalize YouTube URL or ID
    const videoId = extractYouTubeVideoId(input.youtubeUrlOrId);
    if (!videoId) {
      throw new Error(`Invalid YouTube URL or video ID: "${input.youtubeUrlOrId}". Must be an 11-character ID or standard YouTube URL.`);
    }

    // Duplicate check 1: Video ID already mapped to a different anime
    const conflictingAnimeEp = await Episode.findOne({
      youtubeVideoId: videoId,
      anime: { $ne: anime._id },
    }).populate('anime', 'title slug');

    if (conflictingAnimeEp) {
      const conflictingTitle = (conflictingAnimeEp.anime as any)?.title || 'another anime';
      throw new Error(`Conflict: YouTube video ID ${videoId} is already mapped to ${conflictingTitle}. Conflicting cross-anime mappings are prohibited.`);
    }

    // Resolve or create AnimeVersion
    const version = await this.resolveOrCreateVersion(anime._id, audioLanguage);

    // Duplicate check 2: Video ID already mapped within this version
    const existingVideoInVersion = await Episode.findOne({
      version: version._id,
      youtubeVideoId: videoId,
    });
    if (existingVideoInVersion) {
      throw new Error(`Conflict: Video ID ${videoId} is already added as Episode ${existingVideoInVersion.episodeNumber} (Season ${existingVideoInVersion.seasonNumber}) for this version.`);
    }

    // Duplicate check 3: Episode number already exists in this season and version
    const existingEpNumber = await Episode.findOne({
      version: version._id,
      seasonNumber,
      episodeNumber,
    });
    if (existingEpNumber) {
      throw new Error(`Conflict: Episode ${episodeNumber} (Season ${seasonNumber}, ${audioLanguage}) already exists for ${anime.title}.`);
    }

    // Metadata enrichment via public oEmbed if title or thumbnail is missing
    let finalTitle = input.title?.trim();
    let finalThumbnail = input.thumbnail?.trim();
    let channelName = version.channelName || 'Official Channel';

    if (!finalTitle || !finalThumbnail) {
      const oembed = await fetchYouTubeOEmbed(videoId);
      if (oembed) {
        if (!finalTitle && oembed.title) {
          finalTitle = oembed.title;
        }
        if (!finalThumbnail && oembed.thumbnailUrl) {
          finalThumbnail = oembed.thumbnailUrl;
        }
        if (oembed.authorName) {
          channelName = oembed.authorName;
        }
      }
    }

    if (!finalTitle) {
      finalTitle = `Episode ${episodeNumber}`;
    }
    if (!finalThumbnail) {
      finalThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }

    const verificationStatus = input.verificationStatus || 'verified';
    const isPublished = input.isPublished !== undefined ? input.isPublished : verificationStatus === 'verified';

    const episode = await Episode.create({
      anime: anime._id,
      version: version._id,
      seasonNumber,
      episodeNumber,
      title: finalTitle,
      youtubeVideoId: videoId,
      duration: input.duration || '24:00',
      thumbnail: finalThumbnail,
      sourceChannelName: channelName,
      verificationStatus,
      isPublished,
      isEmbeddable: true,
      verifiedAt: verificationStatus === 'verified' ? new Date() : undefined,
      verifiedBy: input.reviewerName || 'admin',
      verificationNotes: input.reviewerNotes || 'Added via Admin Episode Manager',
      lastAvailabilityCheckAt: new Date(),
    });

    await this.recalculateAndInvalidate(anime._id);

    return {
      success: true,
      episode: {
        id: episode._id.toString(),
        animeId: anime._id.toString(),
        animeSlug: anime.slug,
        versionId: version._id.toString(),
        audioLanguage,
        seasonNumber,
        episodeNumber,
        title: finalTitle,
        youtubeVideoId: videoId,
        thumbnail: finalThumbnail,
        isPublished,
        verificationStatus,
      },
    };
  }

  /**
   * Update an existing episode
   */
  static async updateEpisode(episodeId: string, input: UpdateEpisodeInput) {
    await connectToDatabase();
    const episode = await Episode.findById(episodeId);
    if (!episode) {
      throw new Error(`Episode not found with ID "${episodeId}"`);
    }

    // If updating video ID, validate & check conflicts
    if (input.youtubeUrlOrId) {
      const newVideoId = extractYouTubeVideoId(input.youtubeUrlOrId);
      if (!newVideoId) {
        throw new Error(`Invalid YouTube URL or video ID: "${input.youtubeUrlOrId}"`);
      }

      if (newVideoId !== episode.youtubeVideoId) {
        const conflictingEp = await Episode.findOne({
          youtubeVideoId: newVideoId,
          anime: { $ne: episode.anime },
        });
        if (conflictingEp) {
          throw new Error(`Conflict: Video ID ${newVideoId} is already mapped to another anime.`);
        }
        episode.youtubeVideoId = newVideoId;
        if (!input.thumbnail) {
          episode.thumbnail = `https://img.youtube.com/vi/${newVideoId}/hqdefault.jpg`;
        }
      }
    }

    // If updating season or episode number, check unique compound index
    const targetSeason = input.seasonNumber !== undefined ? Math.max(1, Math.floor(input.seasonNumber)) : episode.seasonNumber;
    const targetEpisodeNumber = input.episodeNumber !== undefined ? Math.max(1, Math.floor(input.episodeNumber)) : episode.episodeNumber;

    if (targetSeason !== episode.seasonNumber || targetEpisodeNumber !== episode.episodeNumber) {
      const duplicate = await Episode.findOne({
        version: episode.version,
        seasonNumber: targetSeason,
        episodeNumber: targetEpisodeNumber,
        _id: { $ne: episode._id },
      });
      if (duplicate) {
        throw new Error(`Conflict: Episode ${targetEpisodeNumber} (Season ${targetSeason}) already exists in this version.`);
      }
      episode.seasonNumber = targetSeason;
      episode.episodeNumber = targetEpisodeNumber;
    }

    if (input.title !== undefined) {
      episode.title = input.title.trim();
    }
    if (input.thumbnail !== undefined) {
      episode.thumbnail = input.thumbnail.trim();
    }
    if (input.duration !== undefined) {
      episode.duration = input.duration.trim();
    }
    if (input.verificationStatus !== undefined) {
      episode.verificationStatus = input.verificationStatus;
      if (input.verificationStatus === 'verified') {
        episode.verifiedAt = new Date();
        episode.isPublished = input.isPublished !== undefined ? input.isPublished : true;
      } else {
        episode.isPublished = false;
      }
    }
    if (input.isPublished !== undefined) {
      // Cannot publish unverified or unavailable episode
      if (input.isPublished && episode.verificationStatus !== 'verified') {
        throw new Error('Cannot publish an episode that is not verified. Verify the episode first.');
      }
      episode.isPublished = input.isPublished;
    }
    if (input.reviewerNotes !== undefined) {
      episode.verificationNotes = input.reviewerNotes;
    }
    if (input.reviewerName) {
      episode.verifiedBy = input.reviewerName;
    }

    await episode.save();
    await this.recalculateAndInvalidate(episode.anime);

    return {
      success: true,
      episode: {
        id: episode._id.toString(),
        animeId: episode.anime.toString(),
        seasonNumber: episode.seasonNumber,
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        youtubeVideoId: episode.youtubeVideoId,
        thumbnail: episode.thumbnail,
        isPublished: episode.isPublished,
        verificationStatus: episode.verificationStatus,
      },
    };
  }

  /**
   * Delete an episode
   */
  static async deleteEpisode(episodeId: string) {
    await connectToDatabase();
    const episode = await Episode.findById(episodeId);
    if (!episode) {
      throw new Error(`Episode not found with ID "${episodeId}"`);
    }

    const animeId = episode.anime;
    await Episode.deleteOne({ _id: episode._id });
    const remainingCount = await this.recalculateAndInvalidate(animeId);

    return {
      success: true,
      deletedId: episodeId,
      remainingVerifiedEpisodes: remainingCount,
    };
  }

  /**
   * Verify single episode availability using public oEmbed
   */
  static async verifyEpisode(episodeId: string): Promise<VideoVerificationResult & { episodeId: string }> {
    await connectToDatabase();
    const episode = await Episode.findById(episodeId);
    if (!episode) {
      throw new Error(`Episode not found with ID "${episodeId}"`);
    }

    const verification = await verifyVideoAvailability(episode.youtubeVideoId);
    episode.lastAvailabilityCheckAt = new Date();

    if (verification.status === 'verified') {
      episode.verificationStatus = 'verified';
      episode.isPublished = true;
      episode.isEmbeddable = true;
      episode.verifiedAt = new Date();
      if (verification.title && episode.title.startsWith('Episode ')) {
        episode.title = verification.title;
      }
      if (verification.thumbnailUrl) {
        episode.thumbnail = verification.thumbnailUrl;
      }
    } else if (verification.status === 'deleted' || verification.status === 'private' || verification.status === 'unavailable') {
      episode.verificationStatus = 'unavailable';
      episode.isPublished = false;
      episode.isEmbeddable = false;
      episode.verificationNotes = verification.error || `Status changed to ${verification.status}`;
    }
    // If 'unverified' (network failure), preserve previous status but do not publish

    await episode.save();
    await this.recalculateAndInvalidate(episode.anime);

    return {
      episodeId: episode._id.toString(),
      ...verification,
    };
  }

  /**
   * Batch / Playlist Import workflow
   * Accepts list of video URLs or IDs or multiline text block.
   * Leverages public YouTube oEmbed to fetch title, channel, and thumbnail with zero API key!
   */
  static async batchImportVideos(input: BatchImportInput): Promise<BatchImportResult> {
    await connectToDatabase();

    const anime = await this.resolveAnime(input.animeSlugOrId);
    const audioLanguage = (input.audioLanguage || 'Japanese').trim();
    const baseSeason = input.seasonNumber ? Math.max(1, Math.floor(input.seasonNumber)) : 1;
    const autoVerify = input.autoVerify !== false; // default true

    // Parse input video items
    let rawList: string[] = [];
    if (Array.isArray(input.videoInputs)) {
      rawList = input.videoInputs.flatMap((item) =>
        item.split(/[\r\n,]+/).map((s) => s.trim()).filter(Boolean)
      );
    } else if (typeof input.videoInputs === 'string') {
      rawList = input.videoInputs
        .split(/[\r\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Deduplicate within the incoming batch while preserving order
    const seenBatchIds = new Set<string>();
    const sanitizedBatch: { raw: string; videoId: string }[] = [];
    const reportItems: BatchImportReportItem[] = [];

    let invalidCount = 0;
    let duplicateCount = 0;
    let importedCount = 0;
    let unavailableCount = 0;

    for (const raw of rawList) {
      const vid = extractYouTubeVideoId(raw);
      if (!vid) {
        invalidCount++;
        reportItems.push({
          input: raw,
          status: 'invalid_url',
          message: 'Could not extract valid 11-character YouTube video ID.',
        });
        continue;
      }

      if (seenBatchIds.has(vid)) {
        duplicateCount++;
        reportItems.push({
          input: raw,
          videoId: vid,
          status: 'duplicate_video',
          message: 'Duplicate video ID in submitted batch.',
        });
        continue;
      }

      seenBatchIds.add(vid);
      sanitizedBatch.push({ raw, videoId: vid });
    }

    // Resolve or create AnimeVersion
    const version = await this.resolveOrCreateVersion(anime._id, audioLanguage);

    // Fetch existing episodes for this version to detect episode number collisions and max episode number
    const existingEpisodes = await Episode.find({ version: version._id }).lean();
    const existingVideoIdSet = new Set(existingEpisodes.map((e) => e.youtubeVideoId));
    const existingSeasonEpMap = new Set(existingEpisodes.map((e) => `${e.seasonNumber}_${e.episodeNumber}`));

    // Determine starting episode number for fallback sequential mapping
    const existingInSeason = existingEpisodes.filter((e) => e.seasonNumber === baseSeason);
    let nextSequentialEp = existingInSeason.length > 0
      ? Math.max(...existingInSeason.map((e) => e.episodeNumber)) + 1
      : 1;

    for (const { raw, videoId } of sanitizedBatch) {
      // Check 1: Already mapped to another anime
      const conflictOtherAnime = await Episode.findOne({
        youtubeVideoId: videoId,
        anime: { $ne: anime._id },
      }).populate('anime', 'title');

      if (conflictOtherAnime) {
        duplicateCount++;
        const otherTitle = (conflictOtherAnime.anime as any)?.title || 'another anime';
        reportItems.push({
          input: raw,
          videoId,
          status: 'duplicate_video',
          message: `Already mapped to ${otherTitle}. Cross-anime duplicate prohibited.`,
        });
        continue;
      }

      // Check 2: Already in this anime version
      if (existingVideoIdSet.has(videoId)) {
        duplicateCount++;
        reportItems.push({
          input: raw,
          videoId,
          status: 'duplicate_video',
          message: `Already imported for ${anime.title} (${audioLanguage}).`,
        });
        continue;
      }

      // Check 3: Already recorded as a candidate awaiting review
      const existingCandidate = await YouTubeCandidate.findOne({ youtubeVideoId: videoId });
      if (existingCandidate) {
        duplicateCount++;
        reportItems.push({
          input: raw,
          videoId,
          status: 'duplicate_video',
          message: `Already recorded as candidate for ${existingCandidate.candidateAnimeSlug || anime.title}.`,
        });
        continue;
      }

      // Query public oEmbed to fetch official title, thumbnail, channel name
      const oembed = await fetchYouTubeOEmbed(videoId);
      if (!oembed && autoVerify) {
        // Test availability status
        const avail = await verifyVideoAvailability(videoId);
        if (!avail.isAvailable) {
          unavailableCount++;
          reportItems.push({
            input: raw,
            videoId,
            status: 'unavailable',
            message: avail.error || 'Video is unavailable, deleted, or private on YouTube.',
          });
          continue;
        }
      }

      const videoTitle = oembed?.title || `Episode ${nextSequentialEp}`;
      const channelName = oembed?.authorName || version.channelName || 'Official Channel';
      const thumbnail = oembed?.thumbnailUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      // Determine season and episode numbers
      const parsedSeason = YouTubeService.parseSeasonNumber(videoTitle) || baseSeason;
      let parsedEp = YouTubeService.parseEpisodeNumber(videoTitle, nextSequentialEp - 1);

      // If episode number is already occupied, assign next sequential
      if (existingSeasonEpMap.has(`${parsedSeason}_${parsedEp}`)) {
        parsedEp = nextSequentialEp;
      }

      nextSequentialEp = Math.max(nextSequentialEp + 1, parsedEp + 1);
      existingSeasonEpMap.add(`${parsedSeason}_${parsedEp}`);
      existingVideoIdSet.add(videoId);

      if (autoVerify) {
        await Episode.create({
          anime: anime._id,
          version: version._id,
          seasonNumber: parsedSeason,
          episodeNumber: parsedEp,
          title: videoTitle,
          youtubeVideoId: videoId,
          playlistId: input.playlistId,
          duration: '24:00',
          thumbnail,
          sourceChannelName: channelName,
          verificationStatus: 'verified',
          isPublished: true,
          isEmbeddable: true,
          verifiedAt: new Date(),
          verifiedBy: input.reviewerName || 'admin',
          verificationNotes: 'Imported and verified via Batch Import workflow',
          lastAvailabilityCheckAt: new Date(),
        });

        importedCount++;
        reportItems.push({
          input: raw,
          videoId,
          title: videoTitle,
          seasonNumber: parsedSeason,
          episodeNumber: parsedEp,
          status: 'imported',
          message: `Successfully verified and published as S${parsedSeason} E${parsedEp}.`,
        });
      } else {
        // Create candidate for manual admin review
        await YouTubeCandidate.create({
          youtubeVideoId: videoId,
          channelId: 'batch-import-channel',
          channelTitle: channelName,
          videoTitle: videoTitle,
          thumbnailUrl: thumbnail,
          candidateAnimeId: anime._id,
          candidateAnimeSlug: anime.slug,
          candidateSeasonNumber: parsedSeason,
          candidateEpisodeNumber: parsedEp,
          claimedLanguage: audioLanguage,
          verificationStatus: 'discovered',
          playlistId: input.playlistId,
        });

        importedCount++;
        reportItems.push({
          input: raw,
          videoId,
          title: videoTitle,
          seasonNumber: parsedSeason,
          episodeNumber: parsedEp,
          status: 'candidate_created',
          message: `Saved as candidate for S${parsedSeason} E${parsedEp} (awaiting review).`,
        });
      }
    }

    if (autoVerify && importedCount > 0) {
      await this.recalculateAndInvalidate(anime._id);
    }

    return {
      totalSubmitted: rawList.length,
      importedCount,
      duplicateCount,
      invalidCount,
      unavailableCount,
      items: reportItems,
    };
  }

  /**
   * List episodes with filtering and pagination for admin manager
   */
  static async listEpisodes(params: {
    animeSlugOrId?: string;
    audioLanguage?: string;
    verificationStatus?: string;
    isPublished?: boolean;
    query?: string;
    page?: number;
    limit?: number;
  }) {
    await connectToDatabase();

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(params.limit || 50, 200));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (params.animeSlugOrId) {
      const anime = await this.resolveAnime(params.animeSlugOrId);
      filter.anime = anime._id;
    }

    if (params.verificationStatus && params.verificationStatus !== 'all') {
      filter.verificationStatus = params.verificationStatus;
    }

    if (params.isPublished !== undefined) {
      filter.isPublished = params.isPublished;
    }

    if (params.query && params.query.trim()) {
      const q = params.query.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { youtubeVideoId: { $regex: q, $options: 'i' } },
      ];
    }

    const [episodes, total] = await Promise.all([
      Episode.find(filter)
        .populate('anime', 'title slug poster')
        .populate('version', 'audioLanguage channelName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Episode.countDocuments(filter),
    ]);

    const formatted = episodes.map((ep: any) => ({
      id: ep._id.toString(),
      animeId: ep.anime?._id?.toString(),
      animeTitle: ep.anime?.title || 'Unknown',
      animeSlug: ep.anime?.slug || '',
      animePoster: ep.anime?.poster || '',
      versionId: ep.version?._id?.toString(),
      audioLanguage: ep.version?.audioLanguage || 'Japanese',
      channelName: ep.sourceChannelName || ep.version?.channelName || '',
      seasonNumber: ep.seasonNumber,
      episodeNumber: ep.episodeNumber,
      title: ep.title,
      youtubeVideoId: ep.youtubeVideoId,
      thumbnail: ep.thumbnail,
      duration: ep.duration,
      verificationStatus: ep.verificationStatus,
      isPublished: ep.isPublished,
      isEmbeddable: ep.isEmbeddable,
      lastAvailabilityCheckAt: ep.lastAvailabilityCheckAt,
      verifiedAt: ep.verifiedAt,
      verifiedBy: ep.verifiedBy,
    }));

    return {
      items: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
