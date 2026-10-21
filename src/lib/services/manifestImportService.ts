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
  autoVerifyEligible?: boolean;
  maxVideosPerAnime?: number;
  stage?: 'all' | 'metadata_only' | 'candidates_only';
  resumeFromJobId?: string;
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
  animeWithAtLeastOneEligibleEpisode: Array<{ rawTitle: string; slug: string; episodeCount: number }>;
  animeWithCompleteCollections: Array<{ rawTitle: string; slug: string; episodeCount: number }>;
  titlesWithoutVerifiedFreeEpisodes: Array<{ rawTitle: string; slug: string; reason: string }>;
  unavailableOrRestrictedVideos: Array<{ videoId: string; title: string; reason: string }>;
  quotaOrApiFailures: Array<{ endpoint: string; message: string }>;
  status: 'completed' | 'failed' | 'partial';
  errorSummary?: string;
  resumeCursor?: string;
}

export class ManifestImportService {
  /**
   * Run the two-stage manifest import & verification process:
   * Stage A: Metadata Resolution via AniList
   * Stage B: Candidate Discovery (Playlists + Channel Search) & Strict Verification via Official YouTube channels
   */
  static async importManifest(options: ManifestImportOptions = {}): Promise<ManifestImportReport> {
    await connectToDatabase();
    await YouTubeDiscoveryService.syncOfficialChannels();

    let startIndex = options.startIndex || 0;
    const batchSize = options.batchSize || 10;
    const maxVideosPerAnime = options.maxVideosPerAnime || 50;
    const autoVerify = !!options.autoVerifyEligible;
    const stage = options.stage || 'all';

    // Resume from checkpoint if requested
    if (options.resumeFromJobId) {
      const prevJob = await ImportJob.findById(options.resumeFromJobId);
      if (prevJob?.cursor) {
        try {
          const parsed = JSON.parse(prevJob.cursor);
          if (typeof parsed.lastProcessedIndex === 'number') {
            startIndex = parsed.lastProcessedIndex + 1;
            console.log(`Resuming import from checkpoint index ${startIndex} (job ${options.resumeFromJobId})`);
          }
        } catch {
          // ignore invalid cursor
        }
      }
    }

    // Filter manifest entries if specified
    let entries = ANIME_MANIFEST;
    if (options.filterLanguage) {
      entries = entries.filter((e) => e.claimedLanguage === options.filterLanguage);
    }
    if (options.filterPublisher) {
      entries = entries.filter((e) =>
        e.suggestedPublisher.toLowerCase().includes(options.filterPublisher!.toLowerCase())
      );
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
      animeWithAtLeastOneEligibleEpisode: [],
      animeWithCompleteCollections: [],
      titlesWithoutVerifiedFreeEpisodes: [],
      unavailableOrRestrictedVideos: [],
      quotaOrApiFailures: [],
      status: 'completed',
    };

    let stopDiscoveryDueToQuota = false;

    for (let i = 0; i < selectedSlice.length; i++) {
      const entry = selectedSlice[i];
      const currentIndex = startIndex + i;
      report.totalManifestEntriesProcessed++;
      console.log(`[Manifest ${i + 1}/${selectedSlice.length}] Processing "${entry.rawTitle}" (${entry.claimedLanguage}) on ${entry.suggestedPublisher}...`);

      // ==========================================
      // STAGE A: Metadata Resolution via AniList
      // ==========================================
      let canonicalAnime: any = null;
      try {
        const query = entry.searchQuery || entry.rawTitle;
        const res = await AniListService.resolveAndUpsertByTitle(query, entry.rawTitle);

        if (res.success && res.anime) {
          canonicalAnime = res.anime;
          console.log(`  -> Canonical anime resolved: "${canonicalAnime.title}" (${canonicalAnime.slug})`);
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

      // Courtesy delay between AniList requests
      await new Promise((r) => setTimeout(r, 150));

      if (stage === 'metadata_only') {
        report.titlesWithoutVerifiedFreeEpisodes.push({
          rawTitle: entry.rawTitle,
          slug: canonicalAnime.slug,
          reason: 'Stage A (Metadata) completed. YouTube discovery deferred.',
        });
        continue;
      }

      // ==========================================
      // STAGE B: Complete Candidate Discovery
      // ==========================================
      if (stopDiscoveryDueToQuota) {
        report.titlesWithoutVerifiedFreeEpisodes.push({
          rawTitle: entry.rawTitle,
          slug: canonicalAnime.slug,
          reason: 'Discovery paused due to YouTube API quota exhaustion',
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
      let discoveredPlaylistId: string | undefined;

      // Priority 1: Search for official series / season playlist on the authorized channel
      try {
        const playlistQuery =
          entry.claimedLanguage === 'Hindi'
            ? `${entry.rawTitle} Hindi`
            : entry.rawTitle;

        const playlistRes = await YouTubeService.searchPlaylists(
          publisherInfo.channelId,
          playlistQuery,
          3
        );

        if (playlistRes.error) {
          if (playlistRes.error.toLowerCase().includes('quota')) {
            stopDiscoveryDueToQuota = true;
          }
          report.quotaOrApiFailures.push({
            endpoint: `searchPlaylists (${publisherInfo.channelName})`,
            message: playlistRes.error,
          });
        }

        // Match playlist title with anime
        const matchedPl = (playlistRes.playlists || []).find((pl) => {
          const plTitle = pl.title.toLowerCase();
          const target = entry.rawTitle.toLowerCase();
          const words = target.split(/\s+/).filter((w) => w.length > 2);
          return plTitle.includes(target) || (words.length > 0 && words.every((w) => plTitle.includes(w)));
        });

        if (matchedPl) {
          discoveredPlaylistId = matchedPl.playlistId;
          const plVideosRes = await YouTubeService.fetchPlaylistVideos(
            matchedPl.playlistId,
            maxVideosPerAnime,
            true // fetch all pages in playlist
          );

          if (plVideosRes.error) {
            if (plVideosRes.error.toLowerCase().includes('quota')) {
              stopDiscoveryDueToQuota = true;
            }
            report.quotaOrApiFailures.push({
              endpoint: `fetchPlaylistVideos (${matchedPl.title})`,
              message: plVideosRes.error,
            });
          } else {
            videos = (plVideosRes.videos || []).slice(0, maxVideosPerAnime);
          }
        }
      } catch (plErr) {
        report.quotaOrApiFailures.push({
          endpoint: `searchPlaylists`,
          message: (plErr as Error).message,
        });
      }

      // Priority 2: Fallback to targeted channel video search if no playlist found
      if (videos.length === 0 && !stopDiscoveryDueToQuota) {
        try {
          const searchQuery =
            entry.claimedLanguage === 'Hindi'
              ? `${entry.rawTitle} Hindi Dub Episode`
              : `${entry.rawTitle} Episode`;

          const res = await YouTubeService.searchChannelVideos(
            publisherInfo.channelId,
            searchQuery,
            Math.min(maxVideosPerAnime, 25)
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
      }

      if (videos.length === 0) {
        console.log(`  -> No videos found on ${publisherInfo.channelName} matching query.`);
        report.titlesWithoutVerifiedFreeEpisodes.push({
          rawTitle: entry.rawTitle,
          slug: canonicalAnime.slug,
          reason: 'No public free episodes found on official publisher channel matching query',
        });
        continue;
      }

      console.log(`  -> Found ${videos.length} candidate videos. Checking availability and publishing...`);
      // Process and store discovered candidates
      let verifiedForThisAnime = 0;

      for (const video of videos) {
        if (!video.videoId) continue;

        // Confirm video is a full episode rather than a trailer, clip, teaser, or preview
        if (!YouTubeService.isFullEpisode(video.title)) {
          continue;
        }

        const parsedEp = YouTubeService.parseEpisodeNumber(video.title, video.position);
        const parsedSeason = YouTubeService.parseSeasonNumber(video.title) || entry.expectedSeason || 1;

        // Check if candidate exists already
        let candidateDoc = await YouTubeCandidate.findOne({ youtubeVideoId: video.videoId });

        if (!candidateDoc) {
          try {
            candidateDoc = await YouTubeCandidate.create({
              youtubeVideoId: video.videoId,
              channelId: publisherInfo.channelId,
              channelTitle: publisherInfo.channelName,
              playlistId: video.playlistId || discoveredPlaylistId,
              videoTitle: video.title,
              videoDescription: video.description,
              thumbnailUrl: video.thumbnailUrl,
              candidateAnimeId: canonicalAnime._id,
              candidateAnimeSlug: canonicalAnime.slug,
              candidateEpisodeNumber: parsedEp,
              candidateSeasonNumber: parsedSeason,
              claimedLanguage: entry.claimedLanguage,
              discoveryMethod: discoveredPlaylistId ? 'channel_playlist' : 'channel_search',
              verificationStatus: 'discovered',
            });
            report.realCandidatesDiscoveredCount++;
          } catch (candErr) {
            console.error(`Failed saving candidate ${video.videoId}:`, candErr);
            continue;
          }
        }

        // ==========================================
        // Verification & Availability Check
        // ==========================================
        if (autoVerify && candidateDoc.verificationStatus === 'discovered') {
          // Check embed playback availability
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

          // Validate claimed language
          const titleLower = video.title.toLowerCase();
          const claimedLangLower = entry.claimedLanguage.toLowerCase();
          const isHindiExpected = claimedLangLower === 'hindi';
          const isHindiTitle =
            titleLower.includes('hindi') ||
            titleLower.includes('dub') ||
            publisherInfo.defaultLanguage === 'Hindi';

          if (isHindiExpected && !isHindiTitle) {
            candidateDoc.reviewerNotes = 'Pending review: Claimed Hindi but title does not specify Hindi dub';
            await candidateDoc.save();
            continue;
          }

          try {
            const verifyRes = await VerificationService.verifyAndPublish({
              candidateId: candidateDoc._id.toString(),
              animeSlug: canonicalAnime.slug,
              seasonNumber: parsedSeason,
              episodeNumber: parsedEp,
              episodeTitle: video.title,
              audioLanguage: entry.claimedLanguage,
              reviewerName: 'Manifest Verification Pipeline',
              reviewerNotes: `Verified from official channel ${publisherInfo.channelName}`,
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

      if (verifiedForThisAnime > 0) {
        console.log(`  -> Successfully published ${verifiedForThisAnime} verified episodes for "${canonicalAnime.title}".`);
        report.animeWithAtLeastOneEligibleEpisode.push({
          rawTitle: entry.rawTitle,
          slug: canonicalAnime.slug,
          episodeCount: verifiedForThisAnime,
        });

        // Check if full series / season was populated
        if (verifiedForThisAnime >= 12 || (canonicalAnime.totalEpisodes && verifiedForThisAnime >= canonicalAnime.totalEpisodes)) {
          report.animeWithCompleteCollections.push({
            rawTitle: entry.rawTitle,
            slug: canonicalAnime.slug,
            episodeCount: verifiedForThisAnime,
          });
        }
      } else {
        report.titlesWithoutVerifiedFreeEpisodes.push({
          rawTitle: entry.rawTitle,
          slug: canonicalAnime.slug,
          reason: 'Candidates discovered but require administrator manual review or availability verification',
        });
      }

      // Persist checkpoint cursor after each anime
      const cursorData = JSON.stringify({
        lastProcessedIndex: currentIndex,
        lastProcessedManifestId: entry.id,
        processedSoFar: report.totalManifestEntriesProcessed,
        publishedSoFar: report.episodesApprovedAndPublishedCount,
      });
      report.resumeCursor = cursorData;

      await ImportJob.updateOne(
        { _id: job._id },
        {
          $set: {
            cursor: cursorData,
            progress: Math.round(((i + 1) / selectedSlice.length) * 100),
            processedCount: report.totalManifestEntriesProcessed,
            insertedCount: report.episodesApprovedAndPublishedCount,
            updatedCount: report.animeMetadataImportedCount,
          },
        }
      );
    }

    // Finalize ImportJob
    const isFailed = report.quotaOrApiFailures.length > 0 && report.episodesApprovedAndPublishedCount === 0;
    const isPartial = stopDiscoveryDueToQuota || (report.quotaOrApiFailures.length > 0 && report.episodesApprovedAndPublishedCount > 0);
    const finalStatus = isFailed ? 'failed' : isPartial ? 'partial' : 'completed';
    report.status = finalStatus;

    await ImportJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: finalStatus === 'partial' ? 'completed' : finalStatus, // Mongoose enum allows 'completed' / 'failed'
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
