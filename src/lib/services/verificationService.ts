import { connectToDatabase } from '@/lib/db/mongodb';
import { Anime } from '@/lib/db/models/Anime';
import { AnimeVersion } from '@/lib/db/models/AnimeVersion';
import { Episode } from '@/lib/db/models/Episode';
import { YouTubeCandidate } from '@/lib/db/models/YouTubeCandidate';
import { SourceChannel } from '@/lib/db/models/SourceChannel';
import { OFFICIAL_CHANNELS } from './youtubeDiscoveryService';

export interface VerifyCandidatePayload {
  candidateId: string;
  animeId?: string;
  animeSlug?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  audioLanguage?: string;
  reviewerNotes?: string;
  reviewerName?: string;
}

export class VerificationService {
  /**
   * Verify candidate and publish as an official playable episode.
   * This is the ONLY path that creates published playable episodes.
   */
  static async verifyAndPublish(payload: VerifyCandidatePayload) {
    await connectToDatabase();

    const candidate = await YouTubeCandidate.findById(payload.candidateId);
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Validate source channel authorization: never trust channel names or video titles alone
    const sourceChannelDoc = await SourceChannel.findOne({
      channelId: candidate.channelId,
      officialSourceVerificationStatus: 'verified',
      isEnabled: true,
    });
    const isKnownOfficial = OFFICIAL_CHANNELS.some((c) => c.channelId === candidate.channelId);
    if (!sourceChannelDoc && !isKnownOfficial && !payload.reviewerNotes?.includes('channel_verified_override')) {
      throw new Error(
        `Cannot verify episode: source channel ID "${candidate.channelId}" (${candidate.channelTitle}) is not a verified authorized distributor channel. Add and verify the channel in Source Channels first.`
      );
    }

    // Resolve target anime
    const targetQuery = payload.animeId
      ? { _id: payload.animeId }
      : payload.animeSlug
      ? { slug: payload.animeSlug }
      : candidate.candidateAnimeId
      ? { _id: candidate.candidateAnimeId }
      : candidate.candidateAnimeSlug
      ? { slug: candidate.candidateAnimeSlug }
      : null;

    if (!targetQuery) {
      throw new Error('Must specify target anime to verify candidate');
    }

    const anime = await Anime.findOne(targetQuery);
    if (!anime) {
      throw new Error('Target anime could not be found');
    }

    const audioLanguage = payload.audioLanguage || candidate.claimedLanguage || 'Japanese';
    const seasonNumber = payload.seasonNumber || candidate.candidateSeasonNumber || 1;
    const episodeNumber = payload.episodeNumber || candidate.candidateEpisodeNumber || 1;
    const title = payload.episodeTitle || candidate.videoTitle;
    const reviewer = payload.reviewerName || 'admin';

    if (episodeNumber < 1 || !Number.isInteger(episodeNumber)) {
      throw new Error(`Invalid episode number: ${episodeNumber}. Episode number must be a positive integer.`);
    }
    if (seasonNumber < 1 || !Number.isInteger(seasonNumber)) {
      throw new Error(`Invalid season number: ${seasonNumber}. Season number must be a positive integer.`);
    }

    // Check for conflicting video ID source mapping across different anime
    const conflictingEp = await Episode.findOne({
      youtubeVideoId: candidate.youtubeVideoId,
      isPublished: true,
      anime: { $ne: anime._id },
    });
    if (conflictingEp) {
      throw new Error(
        `YouTube video ID ${candidate.youtubeVideoId} is already mapped to another anime (${conflictingEp.anime}). Conflicting episode source mappings are prohibited.`
      );
    }

    // Find or create AnimeVersion for this audio language
    let version = await AnimeVersion.findOne({
      anime: anime._id,
      audioLanguage,
    });

    if (!version) {
      version = await AnimeVersion.create({
        anime: anime._id,
        audioLanguage,
        languageCode: audioLanguage.toLowerCase().slice(0, 2),
        channelName: candidate.channelTitle,
        sourceChannel: sourceChannelDoc?._id,
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verificationNotes: 'Verified via candidate review workflow',
      });
    }

    // Upsert published Episode: check by video ID first to avoid duplicate key errors
    const existingByVid = await Episode.findOne({
      version: version._id,
      youtubeVideoId: candidate.youtubeVideoId,
    });

    const epQuery = existingByVid
      ? { _id: existingByVid._id }
      : {
          version: version._id,
          seasonNumber,
          episodeNumber,
        };

    const episode = await Episode.findOneAndUpdate(
      epQuery,
      {
        $set: {
          anime: anime._id,
          version: version._id,
          seasonNumber,
          episodeNumber,
          title,
          youtubeVideoId: candidate.youtubeVideoId,
          playlistId: candidate.playlistId,
          duration: candidate.duration || '24:00',
          thumbnail: candidate.thumbnailUrl || `https://img.youtube.com/vi/${candidate.youtubeVideoId}/hqdefault.jpg`,
          sourceChannelName: candidate.channelTitle,
          sourceChannelId: candidate.channelId,
          verificationStatus: 'verified',
          isPublished: true,
          isEmbeddable: true,
          verifiedAt: new Date(),
          verifiedBy: reviewer,
          verificationNotes: payload.reviewerNotes || 'Approved by administrator',
          lastAvailabilityCheckAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Update candidate record
    candidate.verificationStatus = 'verified';
    candidate.candidateAnimeId = anime._id;
    candidate.candidateAnimeSlug = anime.slug;
    candidate.candidateEpisodeNumber = episodeNumber;
    candidate.candidateSeasonNumber = seasonNumber;
    candidate.publishedEpisodeId = episode._id;
    candidate.reviewedBy = reviewer;
    candidate.reviewedAt = new Date();
    candidate.reviewerNotes = payload.reviewerNotes;
    await candidate.save();

    // Recalculate verifiedEpisodeCount on Anime
    const verifiedCount = await Episode.countDocuments({
      anime: anime._id,
      verificationStatus: 'verified',
      isPublished: true,
    });

    anime.verifiedEpisodeCount = verifiedCount;
    await anime.save();

    return {
      success: true,
      animeId: anime._id.toString(),
      animeSlug: anime.slug,
      episodeId: episode._id.toString(),
      verifiedEpisodeCount: verifiedCount,
    };
  }

  /**
   * Reject a candidate video
   */
  static async rejectCandidate(candidateId: string, notes?: string, reviewer = 'admin') {
    await connectToDatabase();
    const candidate = await YouTubeCandidate.findById(candidateId);
    if (!candidate) throw new Error('Candidate not found');

    candidate.verificationStatus = 'rejected';
    candidate.reviewerNotes = notes || 'Rejected by administrator';
    candidate.reviewedBy = reviewer;
    candidate.reviewedAt = new Date();
    await candidate.save();

    return { success: true, candidateId };
  }

  /**
   * Check playback/embed availability for a verified episode using oEmbed
   */
  static async checkAvailability(youtubeVideoId: string): Promise<boolean> {
    try {
      const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeVideoId}&format=json`;
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Batch availability checker
   */
  static async runAvailabilityCheck(limit = 20) {
    await connectToDatabase();
    const episodes = await Episode.find({ verificationStatus: 'verified', isPublished: true }).limit(limit);

    let availableCount = 0;
    let unavailableCount = 0;

    for (const ep of episodes) {
      const isOk = await this.checkAvailability(ep.youtubeVideoId);
      if (isOk) {
        ep.lastAvailabilityCheckAt = new Date();
        availableCount++;
      } else {
        ep.verificationStatus = 'unavailable';
        ep.isPublished = false;
        ep.isEmbeddable = false;
        ep.lastAvailabilityCheckAt = new Date();
        unavailableCount++;
      }
      await ep.save();

      // Recalculate anime verified count
      const count = await Episode.countDocuments({
        anime: ep.anime,
        verificationStatus: 'verified',
        isPublished: true,
      });
      await Anime.updateOne({ _id: ep.anime }, { $set: { verifiedEpisodeCount: count } });
    }

    return {
      checkedCount: episodes.length,
      availableCount,
      unavailableCount,
    };
  }
}
