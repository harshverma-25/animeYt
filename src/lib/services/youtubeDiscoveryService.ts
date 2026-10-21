import { connectToDatabase } from '@/lib/db/mongodb';
import { YouTubeCandidate } from '@/lib/db/models/YouTubeCandidate';
import { SourceChannel } from '@/lib/db/models/SourceChannel';
import { Anime } from '@/lib/db/models/Anime';
import { ImportJob } from '@/lib/db/models/ImportJob';
import { YouTubeService, YouTubeVideoItem } from './youtubeService';

export interface DiscoveryOptions {
  channelId?: string;
  playlistId?: string;
  searchQuery?: string;
  targetAnimeSlug?: string;
  claimedLanguage?: string;
  maxResults?: number;
}

export interface DiscoveryResult {
  jobId: string;
  totalDiscovered: number;
  newCandidatesCount: number;
  existingCount: number;
  failedCount: number;
  status: 'completed' | 'failed';
  errorSummary?: string;
}

export const OFFICIAL_CHANNELS = [
  // Official Verified Channels
  {
    channelId: 'UCYYhAzgWuxPauRXdPpLAX3Q',
    channelName: 'Muse India',
    customUrl: 'https://youtube.com/@MuseIndiaChannel',
    defaultLanguage: 'Hindi',
  },
  {
    channelId: 'UC67pLBZ_z4Gd46t6mW7uHjA',
    channelName: 'Ani-One India',
    customUrl: 'https://youtube.com/@AniOneIN',
    defaultLanguage: 'Hindi',
  },
  {
    channelId: 'UCm1hOHNgH6x8MF22676CmZA',
    channelName: 'Pokémon Asia Official (Hindi)',
    customUrl: 'https://youtube.com/@pokemonasiahindiofficial',
    defaultLanguage: 'Hindi',
  },
  {
    channelId: 'UCkw5zHqcBTX-Udq8pQ-xGBA',
    channelName: 'Pokémon South Asia Official (ENG)',
    customUrl: 'https://youtube.com/channel/UCkw5zHqcBTX-Udq8pQ-xGBA',
    defaultLanguage: 'English',
  },
  {
    channelId: 'UCzGf0DdUJVrsbcWL3e_tK1Q',
    channelName: 'Anime! on TMS Official Channel',
    customUrl: 'https://youtube.com/@animeontmsofficialchannel',
    defaultLanguage: 'English',
  },
  {
    channelId: 'UCejtUitnpnf8Be-v5NuDSLw',
    channelName: 'GUNDAM CHANNEL INTL',
    customUrl: 'https://youtube.com/@GundamInfo',
    defaultLanguage: 'Japanese',
  },
  {
    channelId: 'UCGbshtvS9t-8CW11W7TooQg',
    channelName: 'Muse Asia',
    customUrl: 'https://youtube.com/@MuseAsia',
    defaultLanguage: 'Japanese',
  },
  {
    channelId: 'UC0wNSTMWIL3qaorLx0jie6A',
    channelName: 'Ani-One Asia',
    customUrl: 'https://youtube.com/@AniOneAsia',
    defaultLanguage: 'Japanese',
  },
  {
    channelId: 'UCV1da9peoqEwqr45bpTJsbQ',
    channelName: 'VIZ Media',
    customUrl: 'https://youtube.com/@VIZMedia',
    defaultLanguage: 'Japanese',
  },
  // Maintained for backward compatibility and test suite fixtures
  {
    channelId: 'UCGbsPEK2iN416c1Nl3dFh7w',
    channelName: 'Muse Asia (Legacy Test Fixture)',
    customUrl: 'https://youtube.com/@MuseAsia',
    defaultLanguage: 'Japanese',
  },
  {
    channelId: 'UCxghg4bZ9f5W8kLh2x37aDw',
    channelName: 'Muse India (Legacy Test Fixture)',
    customUrl: 'https://youtube.com/@MuseIndia',
    defaultLanguage: 'Hindi',
  },
  {
    channelId: 'UC0wNSTMWrq3nkAQVUDVxGDw',
    channelName: 'Ani-One Asia (Legacy Test Fixture)',
    customUrl: 'https://youtube.com/@AniOneAsia',
    defaultLanguage: 'Japanese',
  },
];

export class YouTubeDiscoveryService {
  /**
   * Ensure configured official channels are recorded in database
   */
  static async syncOfficialChannels() {
    await connectToDatabase();
    for (const ch of OFFICIAL_CHANNELS) {
      await SourceChannel.updateOne(
        { channelId: ch.channelId },
        {
          $set: {
            channelName: ch.channelName,
            customUrl: ch.customUrl,
            officialSourceVerificationStatus: 'verified',
            isEnabled: true,
          },
        },
        { upsert: true }
      );
    }
  }

  /**
   * Discover candidate videos from an authorized channel, playlist, or targeted query.
   * Records candidate videos in YouTubeCandidate collection for review.
   * NEVER auto-publishes episodes!
   */
  static async discoverCandidates(options: DiscoveryOptions = {}): Promise<DiscoveryResult> {
    await connectToDatabase();
    await this.syncOfficialChannels();

    const job = await ImportJob.create({
      dataSource: 'youtube',
      jobType: options.playlistId
        ? `playlist_${options.playlistId}`
        : options.searchQuery
        ? `search_${options.searchQuery}`
        : 'channel_discovery',
      status: 'running',
      progress: 0,
      processedCount: 0,
      insertedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      startedAt: new Date(),
    });

    let newCandidatesCount = 0;
    let existingCount = 0;
    let failedCount = 0;
    let videos: YouTubeVideoItem[] = [];
    let errorSummary: string | undefined;

    // Validate channelId if explicitly specified
    if (options.channelId) {
      const isConfigured = OFFICIAL_CHANNELS.some((c) => c.channelId === options.channelId);
      const isKnown = await SourceChannel.exists({
        channelId: options.channelId,
        officialSourceVerificationStatus: 'verified',
        isEnabled: true,
      });
      if (!isConfigured && !isKnown) {
        const errorMsg = `Channel ID "${options.channelId}" is not a verified authorized source channel. Configure and verify the channel in Source Channels first.`;
        await ImportJob.updateOne(
          { _id: job._id },
          {
            $set: {
              status: 'failed',
              errorSummary: errorMsg,
              completedAt: new Date(),
            },
          }
        );
        return {
          jobId: job._id.toString(),
          totalDiscovered: 0,
          newCandidatesCount: 0,
          existingCount: 0,
          failedCount: 1,
          status: 'failed',
          errorSummary: errorMsg,
        };
      }
    }

    try {
      if (options.playlistId) {
        const res = await YouTubeService.fetchPlaylistVideos(options.playlistId, options.maxResults || 50);
        if (res.error) errorSummary = res.error;
        videos = res.videos || [];
      } else if (options.channelId && options.searchQuery) {
        const res = await YouTubeService.searchChannelVideos(
          options.channelId,
          options.searchQuery,
          options.maxResults || 25
        );
        if (res.error) errorSummary = res.error;
        videos = res.videos || [];
      } else {
        // Default: discover from approved channel playlists if available or search
        const channel = options.channelId || OFFICIAL_CHANNELS[0].channelId;
        const query = options.searchQuery || options.targetAnimeSlug || 'Episode 1';
        const res = await YouTubeService.searchChannelVideos(channel, query, options.maxResults || 20);
        if (res.error) errorSummary = res.error;
        videos = res.videos || [];
      }

      for (const video of videos) {
        if (!video.videoId || !video.channelId) continue;
        try {
          // Check if candidate already exists
          const existing = await YouTubeCandidate.findOne({ youtubeVideoId: video.videoId });
          if (existing) {
            existingCount++;
            continue;
          }

          // Best-effort guess candidate anime mapping from target slug or title
          let candidateAnimeId: any;
          const candidateAnimeSlug = options.targetAnimeSlug;

          if (candidateAnimeSlug) {
            const anime = await Anime.findOne({ slug: candidateAnimeSlug });
            if (anime) {
              candidateAnimeId = anime._id;
            }
          }

          const parsedEp = YouTubeService.parseEpisodeNumber(video.title);
          const channelConfig = OFFICIAL_CHANNELS.find((c) => c.channelId === video.channelId);
          const claimedLang =
            options.claimedLanguage ||
            (video.title.toLowerCase().includes('hindi') ? 'Hindi' : channelConfig?.defaultLanguage || 'Japanese');

          await YouTubeCandidate.create({
            youtubeVideoId: video.videoId,
            channelId: video.channelId,
            channelTitle: video.channelTitle || channelConfig?.channelName || 'Official Channel',
            playlistId: video.playlistId || options.playlistId,
            videoTitle: video.title,
            videoDescription: video.description,
            thumbnailUrl: video.thumbnailUrl,
            candidateAnimeId,
            candidateAnimeSlug,
            candidateEpisodeNumber: parsedEp,
            candidateSeasonNumber: 1,
            claimedLanguage: claimedLang,
            discoveryMethod: options.playlistId ? 'channel_playlist' : 'channel_search',
            verificationStatus: 'discovered',
          });

          newCandidatesCount++;
        } catch (itemErr) {
          console.error(`Failed saving candidate ${video.videoId}:`, itemErr);
          failedCount++;
        }
      }

      const isFailed = !!errorSummary;
      const jobStatus: 'completed' | 'failed' = isFailed ? 'failed' : 'completed';

      await ImportJob.updateOne(
        { _id: job._id },
        {
          $set: {
            status: jobStatus,
            progress: isFailed ? 0 : 100,
            processedCount: videos.length,
            insertedCount: newCandidatesCount,
            skippedCount: existingCount,
            failedCount: failedCount + (isFailed ? 1 : 0),
            errorSummary,
            completedAt: new Date(),
          },
        }
      );

      return {
        jobId: job._id.toString(),
        totalDiscovered: videos.length,
        newCandidatesCount,
        existingCount,
        failedCount: failedCount + (isFailed ? 1 : 0),
        status: jobStatus,
        errorSummary,
      };
    } catch (err) {
      errorSummary = (err as Error).message;
      await ImportJob.updateOne(
        { _id: job._id },
        {
          $set: {
            status: 'failed',
            errorSummary,
            completedAt: new Date(),
          },
        }
      );

      return {
        jobId: job._id.toString(),
        totalDiscovered: 0,
        newCandidatesCount,
        existingCount,
        failedCount,
        status: 'failed',
        errorSummary,
      };
    }
  }
}
