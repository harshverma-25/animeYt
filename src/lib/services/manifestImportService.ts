import { connectToDatabase } from '@/lib/db/mongodb';
import { YouTubeCandidate } from '@/lib/db/models/YouTubeCandidate';
import { ImportJob } from '@/lib/db/models/ImportJob';
import { AniListService } from './anilistService';
import { YouTubeDiscoveryService } from './youtubeDiscoveryService';
import { YouTubeService, YouTubeVideoItem } from './youtubeService';
import { VerificationService } from './verificationService';
import { ANIME_MANIFEST } from '../data/animeManifest';

export const PUBLISHER_CHANNELS: Record<string, { channelId: string; channelName: string; defaultLanguage: string }> = {
  'Muse India': {
    channelId: 'UCYYhAzgWuxPauRXdPpLAX3Q',
    channelName: 'Muse India',
    defaultLanguage: 'Hindi',
  },
  'Ani-One India': {
    channelId: 'UC67pLBZ_z4Gd46t6mW7uHjA',
    channelName: 'Ani-One India',
    defaultLanguage: 'Hindi',
  },
  'Pokémon': {
    channelId: 'UCm1hOHNgH6x8MF22676CmZA',
    channelName: 'Pokémon Asia Official (Hindi)',
    defaultLanguage: 'Hindi',
  },
  'Pokémon South Asia Official English': {
    channelId: 'UCkw5zHqcBTX-Udq8pQ-xGBA',
    channelName: 'Pokémon South Asia Official (ENG)',
    defaultLanguage: 'English',
  },
  'Anime! On TMS Official Channel': {
    channelId: 'UCzGf0DdUJVrsbcWL3e_tK1Q',
    channelName: 'Anime! on TMS Official Channel',
    defaultLanguage: 'English',
  },
  'Gundam Official': {
    channelId: 'UCejtUitnpnf8Be-v5NuDSLw',
    channelName: 'GUNDAM CHANNEL INTL',
    defaultLanguage: 'Japanese',
  },
  'Muse Asia': {
    channelId: 'UCGbshtvS9t-8CW11W7TooQg',
    channelName: 'Muse Asia',
    defaultLanguage: 'Japanese',
  },
  'Ani-One Asia': {
    channelId: 'UC0wNSTMWIL3qaorLx0jie6A',
    channelName: 'Ani-One Asia',
    defaultLanguage: 'Japanese',
  },
  'VIZ Media': {
    channelId: 'UCV1da9peoqEwqr45bpTJsbQ',
    channelName: 'VIZ Media',
    defaultLanguage: 'Japanese',
  },
};

export interface ManifestImportOptions {
  batchSize?: number;
  startIndex?: number;
  filterLanguage?: 'Hindi' | 'English' | 'Japanese';
  filterPublisher?: string;
  autoVerifyEligible?: boolean; // strictly publish only candidates meeting all 8 verification criteria
  maxVideosPerAnime?: number;
  stage?: 'all' | 'metadata_only' | 'candidates_only';
}

export interface ManifestImportReport {
  jobId: string;
  totalManifestEntriesProcessed: number;
  matchedCanonicalAnime: Array<{ manifestId: string; rawTitle: string; canonicalTitle: string; slug: string }>;
  unmatchedOrAmbiguousTitles: Array<{ manifestId: string; rawTitle: string; reason: string }>;
  animeMetadataImportedCount: number;
  realCandidatesDiscoveredCount: number;
  verifiedOfficialSourcesCount: number;
  episodesApprovedAndPublishedCount: number;
  titlesWithoutVerifiedFreeEpisodes: Array<{ rawTitle: string; slug: string; reason: string }>;
  unavailableOrRestrictedVideos: Array<{ videoId: string; title: string; reason: string }>;
  quotaOrApiFailures: Array<{ endpoint: string; message: string }>;
  status: 'completed' | 'failed' | 'partial';
  errorSummary?: string;
}

export class ManifestImportService {
  /**
   * Run the two-stage manifest import & verification process:
   * Stage A: Metadata Resolution via AniList
   * Stage B: Candidate Discovery & Availability Verification via Official YouTube channels
   */
  static async importManifest(options: ManifestImportOptions = {}): Promise<ManifestImportReport> {
    await connectToDatabase();
    await YouTubeDiscoveryService.syncOfficialChannels();

    const startIndex = options.startIndex || 0;
    const batchSize = options.batchSize || 10;
    const maxVideosPerAnime = options.maxVideosPerAnime || 3;
    const autoVerify = !!options.autoVerifyEligible;

    // Filter manifest entries if specified
    let entries = ANIME_MANIFEST;
    if (options.filterLanguage) {
      entries = entries.filter((e) => e.claimedLanguage === options.filterLanguage);
    }
    if (options.filterPublisher) {
      entries = entries.filter((e) => e.suggestedPublisher.toLowerCase().includes(options.filterPublisher!.toLowerCase()));
    }

    const selectedSlice = entries.slice(startIndex, startIndex + batchSize);

    const job: any = await ImportJob.create({
      dataSource: 'youtube',
      jobType: `manifest_import_idx${startIndex}_n${selectedSlice.length}`,
      status: 'running',
      progress: 0,
      processedCount: 0,
      insertedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      startedAt: new Date(),
    });

    const report: ManifestImportReport = {
      jobId: job._id.toString(),
      totalManifestEntriesProcessed: 0,
      matchedCanonicalAnime: [],
      unmatchedOrAmbiguousTitles: [],
      animeMetadataImportedCount: 0,
      realCandidatesDiscoveredCount: 0,
      verifiedOfficialSourcesCount: Object.keys(PUBLISHER_CHANNELS).length,
      episodesApprovedAndPublishedCount: 0,
      titlesWithoutVerifiedFreeEpisodes: [],
      unavailableOrRestrictedVideos: [],
      quotaOrApiFailures: [],
      status: 'completed',
    };

    let stopDiscoveryDueToQuota = false;

    for (let i = 0; i < selectedSlice.length; i++) {
      const entry = selectedSlice[i];
      report.totalManifestEntriesProcessed++;

      // ==========================================
      // STAGE A: Metadata Resolution via AniList
      // ==========================================
      let canonicalAnime: any = null;
      try {
        const query = entry.searchQuery || entry.rawTitle;
        const res = await AniListService.resolveAndUpsertByTitle(query, entry.rawTitle);

        if (res.success && res.anime) {
          canonicalAnime = res.anime;
          report.matchedCanonicalAnime.push({
            manifestId: entry.id,
            rawTitle: entry.rawTitle,
            canonicalTitle: canonicalAnime.title,
            slug: canonicalAnime.slug,
          });
          report.animeMetadataImportedCount++;
        } else {
          report.unmatchedOrAmbiguousTitles.push({
            manifestId: entry.id,
            rawTitle: entry.rawTitle,
            reason: res.error || 'Title could not be resolved in AniList',
          });
          // Do not fabricate metadata, continue to next
          continue;
        }
      } catch (err) {
        report.unmatchedOrAmbiguousTitles.push({
          manifestId: entry.id,
          rawTitle: entry.rawTitle,
          reason: (err as Error).message,
        });
        continue;
      }

      // Small delay between AniList requests to avoid 429
      await new Promise((r) => setTimeout(r, 200));

      if (options.stage === 'metadata_only') {
        report.titlesWithoutVerifiedFreeEpisodes.push({
          rawTitle: entry.rawTitle,
          slug: canonicalAnime.slug,
          reason: 'Stage A (Metadata) completed. YouTube discovery deferred.',
        });
        continue;
      }

      // ==========================================
      // STAGE B: Candidate Video Discovery
      // ==========================================
      if (stopDiscoveryDueToQuota) {
        report.titlesWithoutVerifiedFreeEpisodes.push({
          rawTitle: entry.rawTitle,
          slug: canonicalAnime.slug,
          reason: 'Discovery paused due to YouTube API quota exhaustion or upstream failure',
        });
        continue;
      }

      const publisherInfo = PUBLISHER_CHANNELS[entry.suggestedPublisher];
      if (!publisherInfo) {
        report.unmatchedOrAmbiguousTitles.push({
          manifestId: entry.id,
          rawTitle: entry.rawTitle,
          reason: `No verified channel configuration found for publisher "${entry.suggestedPublisher}"`,
        });
        continue;
      }

      let videos: YouTubeVideoItem[] = [];
      const searchQuery = `${entry.rawTitle} Episode`;

      try {
        const res = await YouTubeService.searchChannelVideos(
          publisherInfo.channelId,
          searchQuery,
          maxVideosPerAnime
        );

        if (res.error) {
          if (res.error.toLowerCase().includes('quota')) {
            stopDiscoveryDueToQuota = true;
          }
          report.quotaOrApiFailures.push({
            endpoint: `searchChannelVideos (${publisherInfo.channelName})`,
            message: res.error,
          });
        } else {
          videos = res.videos || [];
        }
      } catch (searchErr) {
        report.quotaOrApiFailures.push({
          endpoint: `searchChannelVideos (${publisherInfo.channelName})`,
          message: (searchErr as Error).message,
        });
      }

      if (videos.length === 0) {
        report.titlesWithoutVerifiedFreeEpisodes.push({
          rawTitle: entry.rawTitle,
          slug: canonicalAnime.slug,
          reason: 'No public free episodes found on official publisher channel matching query',
        });
        continue;
      }

      // Process and store candidates
      let verifiedForThisAnime = 0;

      for (const video of videos) {
        if (!video.videoId) continue;

        // Check if candidate exists already
        let candidateDoc = await YouTubeCandidate.findOne({ youtubeVideoId: video.videoId });
        const parsedEp = YouTubeService.parseEpisodeNumber(video.title);

        if (!candidateDoc) {
          try {
            candidateDoc = await YouTubeCandidate.create({
              youtubeVideoId: video.videoId,
              channelId: publisherInfo.channelId,
              channelTitle: publisherInfo.channelName,
              videoTitle: video.title,
              videoDescription: video.description,
              thumbnailUrl: video.thumbnailUrl,
              candidateAnimeId: canonicalAnime._id,
              candidateAnimeSlug: canonicalAnime.slug,
              candidateEpisodeNumber: parsedEp,
              candidateSeasonNumber: entry.expectedSeason || 1,
              claimedLanguage: entry.claimedLanguage,
              discoveryMethod: 'channel_search',
              verificationStatus: 'discovered',
            });
            report.realCandidatesDiscoveredCount++;
          } catch (candErr) {
            console.error(`Failed creating candidate ${video.videoId}:`, candErr);
            continue;
          }
        }

        // ==========================================
        // Verification & Availability Check
        // ==========================================
        if (autoVerify && candidateDoc.verificationStatus === 'discovered') {
          // Check embed availability
          const isEmbeddable = await VerificationService.checkAvailability(video.videoId);

          if (!isEmbeddable) {
            candidateDoc.verificationStatus = 'rejected';
            candidateDoc.reviewerNotes = 'Rejected: YouTube oEmbed returned non-OK (unavailable/non-embeddable)';
            await candidateDoc.save();
            report.unavailableOrRestrictedVideos.push({
              videoId: video.videoId,
              title: video.title,
              reason: 'YouTube oEmbed returned non-OK or restricted playback',
            });
            continue;
          }

          // Check language validation: verify video title matches claimed language
          const titleLower = video.title.toLowerCase();
          const claimedLangLower = entry.claimedLanguage.toLowerCase();
          const isHindiExpected = claimedLangLower === 'hindi';
          const isHindiTitle = titleLower.includes('hindi') || titleLower.includes('dub') || publisherInfo.defaultLanguage === 'Hindi';

          if (isHindiExpected && !isHindiTitle) {
            candidateDoc.reviewerNotes = 'Pending review: Claimed Hindi but title does not specify Hindi dub';
            await candidateDoc.save();
            continue;
          }

          try {
            // Verify and publish
            const verifyRes = await VerificationService.verifyAndPublish({
              candidateId: candidateDoc._id.toString(),
              animeSlug: canonicalAnime.slug,
              episodeNumber: parsedEp,
              episodeTitle: video.title,
              audioLanguage: entry.claimedLanguage,
              reviewerName: 'Manifest Verification Pipeline',
              reviewerNotes: `Verified from official source channel ${publisherInfo.channelName}`,
            });

            if (verifyRes.success) {
              report.episodesApprovedAndPublishedCount++;
              verifiedForThisAnime++;
            }
          } catch (vErr) {
            console.warn(`Verification skipped for ${video.videoId}:`, (vErr as Error).message);
          }
        }
      }

      if (verifiedForThisAnime === 0) {
        report.titlesWithoutVerifiedFreeEpisodes.push({
          rawTitle: entry.rawTitle,
          slug: canonicalAnime.slug,
          reason: 'Candidates discovered but require administrator manual review or availability verification',
        });
      }
    }

    // Update ImportJob
    const isFailed = report.quotaOrApiFailures.length > 0 && report.matchedCanonicalAnime.length === 0;
    const finalStatus = isFailed ? 'failed' : 'completed';
    report.status = finalStatus;

    await ImportJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: finalStatus,
          progress: 100,
          processedCount: report.totalManifestEntriesProcessed,
          insertedCount: report.episodesApprovedAndPublishedCount,
          updatedCount: report.animeMetadataImportedCount,
          skippedCount: report.unmatchedOrAmbiguousTitles.length,
          failedCount: report.quotaOrApiFailures.length,
          completedAt: new Date(),
          errorSummary: report.quotaOrApiFailures.map((f) => f.message).join('; ') || undefined,
        },
      }
    );

    return report;
  }
}
