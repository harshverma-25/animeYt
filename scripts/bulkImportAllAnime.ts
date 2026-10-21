import { connectToDatabase } from '../src/lib/db/mongodb';
import { Anime } from '../src/lib/db/models/Anime';
import { AnimeVersion } from '../src/lib/db/models/AnimeVersion';
import { Episode } from '../src/lib/db/models/Episode';
import { YouTubeCandidate } from '../src/lib/db/models/YouTubeCandidate';
import { AniListService } from '../src/lib/services/anilistService';
import { YouTubeService, YouTubeVideoItem } from '../src/lib/services/youtubeService';
import { CatalogueService } from '../src/lib/services/catalogueService';
import { ANIME_MANIFEST, ManifestEntry } from '../src/lib/data/animeManifest';
import { PUBLISHER_CHANNELS } from '../src/lib/services/manifestImportService';
import mongoose from 'mongoose';

// Enhanced Season & Episode Parser
export function parseSeasonAndEpisode(title: string, defaultSeason = 1) {
  let season = defaultSeason;
  let episode = 1;

  // 1. Direct S#E# pattern: e.g. (S3E08) or S01E05 or S2 EP 4
  const sAndE = title.match(/S(\d+)[\s_-]*E(?:P)?[\s_-]*(\d+)/i);
  if (sAndE) {
    season = parseInt(sAndE[1], 10);
    episode = parseInt(sAndE[2], 10);
    return { season, episode };
  }

  // 2. Season patterns:
  // e.g. "Season 2", "2nd Season", "Second Season", "Season 03", "Act II", "Part 2"
  const seasonMatch =
    title.match(/\bseason\s*(\d+)/i) ||
    title.match(/(\d+)(?:st|nd|rd|th)\s*season/i) ||
    title.match(/\bS(\d+)\b/i) ||
    title.match(/\bpart\s*(\d+)\b/i);

  if (seasonMatch && seasonMatch[1]) {
    season = parseInt(seasonMatch[1], 10);
  } else if (/second\s*season|act\s*(?:ii|2)/i.test(title)) {
    season = 2;
  } else if (/third\s*season|act\s*(?:iii|3)/i.test(title)) {
    season = 3;
  } else if (/fourth\s*season|act\s*(?:iv|4)/i.test(title)) {
    season = 4;
  } else if (/\b[a-zA-Z\s]+(?:\s+2|\s+II)\s*-\s*Episode/i.test(title)) {
    season = 2;
  }

  // 3. Episode patterns:
  // e.g. "Episode 18", "EP 01", "Ep. 05", "Episode #12"
  const epMatch =
    title.match(/(?:episode|ep\.?|e)\s*#?\s*(\d{1,4})/i) ||
    title.match(/#(\d{1,4})\b/);

  if (epMatch && epMatch[1]) {
    episode = parseInt(epMatch[1], 10);
  } else {
    const fallbackNum = title.match(/\b(0?[1-9]\d?)\b/);
    if (fallbackNum && fallbackNum[1]) {
      episode = parseInt(fallbackNum[1], 10);
    }
  }

  return { season, episode };
}

// Enhanced Audio Language Detector
export function detectAudioLanguage(title: string, claimedLanguage: string, channelName = ''): string {
  const lower = title.toLowerCase();

  if (lower.includes('hindi dub') || lower.includes('[hindi]')) {
    return 'Hindi';
  }
  if (lower.includes('english dub') || lower.includes('[english dub]')) {
    return 'English';
  }
  if (lower.includes('english sub') || lower.includes('[english sub]') || lower.includes('eng sub')) {
    return 'Japanese'; // Japanese audio with English subs
  }
  if (lower.includes('japanese') || lower.includes('[jp]')) {
    return 'Japanese';
  }

  if (claimedLanguage) return claimedLanguage;
  if (/muse india|ani-one india|pokémon.*hindi/i.test(channelName)) return 'Hindi';
  if (/muse asia|ani-one asia|gundam/i.test(channelName)) return 'Japanese';
  if (/tms|english/i.test(channelName)) return 'English';

  return 'Japanese';
}

async function run() {
  console.log('Connecting to database...');
  await connectToDatabase();

  const args = process.argv.slice(2);
  const langArg = args.find((a) => a.startsWith('--lang='));
  const startArg = args.find((a) => a.startsWith('--start='));
  const batchArg = args.find((a) => a.startsWith('--batch='));
  const fixOnly = args.includes('--fix-existing-only');

  const filterLang = langArg ? langArg.split('=')[1] : undefined;
  const startIndex = startArg ? parseInt(startArg.split('=')[1], 10) : 0;
  const batchSize = batchArg ? parseInt(batchArg.split('=')[1], 10) : 200;

  console.log('=== AnimeYT Bulk Importer (Auto-Publish, Season-Wise) ===');
  console.log(`- Start Index: ${startIndex}`);
  console.log(`- Batch Size: ${batchSize}`);
  console.log(`- Language Filter: ${filterLang || 'All (Hindi, English, Japanese)'}`);

  // In-Memory Lookups for maximum speed over remote Atlas connection
  console.log('\nLoading database caches for rapid in-memory reconciliation...');
  const allAnimeDocs = await Anime.find({});
  const animeById = new Map(allAnimeDocs.map(a => [a._id.toString(), a]));
  const animeBySlug = new Map(allAnimeDocs.map(a => [a.slug, a]));

  const allVersionDocs = await AnimeVersion.find({});
  const versionMap = new Map(allVersionDocs.map(v => [`${v.anime.toString()}_${v.audioLanguage}`, v]));

  const allEpisodeDocs = await Episode.find({}, 'version youtubeVideoId seasonNumber episodeNumber');
  const epByVideoId = new Set(allEpisodeDocs.map(e => `${e.version.toString()}_${e.youtubeVideoId}`));
  const epBySeasonAndNum = new Set(allEpisodeDocs.map(e => `${e.version.toString()}_${e.seasonNumber}_${e.episodeNumber}`));

  console.log(`Loaded ${animeById.size} anime, ${versionMap.size} versions, and ${allEpisodeDocs.length} episodes.`);

  // Step 1: Fast in-memory reconciliation of all existing candidates
  console.log('\n--- Step 1: Reconciling Existing Candidates ---');
  const allCandidates = await YouTubeCandidate.find({}).lean();
  let candidateSyncCount = 0;
  const newEpisodesToInsert: any[] = [];

  for (const cand of allCandidates) {
    if (!cand.candidateAnimeId && !cand.candidateAnimeSlug) continue;

    const anime = cand.candidateAnimeId
      ? animeById.get(cand.candidateAnimeId.toString())
      : animeBySlug.get(cand.candidateAnimeSlug!);

    if (!anime) continue;

    const audioLanguage = detectAudioLanguage(cand.videoTitle, cand.claimedLanguage, cand.channelTitle);
    const parsed = parseSeasonAndEpisode(cand.videoTitle, cand.candidateSeasonNumber || 1);
    const seasonNumber = parsed.season;
    const episodeNumber = parsed.episode || cand.candidateEpisodeNumber || 1;

    // Version lookup or create
    const versionKey = `${anime._id.toString()}_${audioLanguage}`;
    let version = versionMap.get(versionKey);

    if (!version) {
      version = await AnimeVersion.create({
        anime: anime._id,
        audioLanguage,
        languageCode: audioLanguage.toLowerCase().slice(0, 2),
        channelName: cand.channelTitle || 'Official Channel',
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verificationNotes: 'Auto-published via Bulk Importer',
      });
      versionMap.set(versionKey, version);
    }

    const vidKey = `${version._id.toString()}_${cand.youtubeVideoId}`;
    const numKey = `${version._id.toString()}_${seasonNumber}_${episodeNumber}`;

    if (!epByVideoId.has(vidKey) && !epBySeasonAndNum.has(numKey)) {
      newEpisodesToInsert.push({
        anime: anime._id,
        version: version._id,
        seasonNumber,
        episodeNumber,
        title: cand.videoTitle,
        youtubeVideoId: cand.youtubeVideoId,
        playlistId: cand.playlistId,
        duration: cand.duration || '24:00',
        thumbnail: cand.thumbnailUrl || `https://img.youtube.com/vi/${cand.youtubeVideoId}/hqdefault.jpg`,
        sourceChannelName: cand.channelTitle || version.channelName,
        sourceChannelId: cand.channelId,
        verificationStatus: 'verified',
        isPublished: true,
        isEmbeddable: true,
        verifiedAt: new Date(),
        verifiedBy: 'Bulk Importer',
        lastAvailabilityCheckAt: new Date(),
      });
      epByVideoId.add(vidKey);
      epBySeasonAndNum.add(numKey);
      candidateSyncCount++;
    }
  }

  if (newEpisodesToInsert.length > 0) {
    console.log(`Inserting ${newEpisodesToInsert.length} missing published episodes in bulk...`);
    await Episode.insertMany(newEpisodesToInsert, { ordered: false }).catch(() => {});
    console.log(`Successfully published ${newEpisodesToInsert.length} episodes from candidates!`);
  } else {
    console.log('All candidates already present in Episode collection.');
  }

  if (fixOnly) {
    console.log('Fix-only specified. Recalculating verified episode counts and exiting...');
    for (const [id, a] of animeById.entries()) {
      const count = await Episode.countDocuments({ anime: a._id, isPublished: true, verificationStatus: 'verified' });
      if (a.verifiedEpisodeCount !== count) {
        a.verifiedEpisodeCount = count;
        await a.save();
      }
    }
    CatalogueService.clearCache();
    console.log('Done!');
    await mongoose.disconnect();
    return;
  }

  // Step 2: Discover and Import all anime from ANIME_MANIFEST
  console.log('\n--- Step 2: Discovering & Importing Manifest Anime from YouTube ---');
  let manifestEntries = ANIME_MANIFEST.filter((e) => e.claimedLanguage !== 'Japanese');
  if (filterLang) {
    manifestEntries = manifestEntries.filter(
      (e) => e.claimedLanguage.toLowerCase() === filterLang.toLowerCase()
    );
  }

  const selectedEntries = manifestEntries.slice(startIndex, startIndex + batchSize);
  console.log(`Processing ${selectedEntries.length} manifest entries...`);

  let totalAnimeAdded = 0;
  let totalEpisodesAdded = 0;
  let stopDueToQuota = false;

  for (let i = 0; i < selectedEntries.length; i++) {
    const entry = selectedEntries[i];
    console.log(`\n[${i + 1}/${selectedEntries.length}] Anime: "${entry.rawTitle}" (${entry.claimedLanguage}) on ${entry.suggestedPublisher}`);

    // Resolve Canonical Anime Metadata
    let canonicalAnime: any = animeBySlug.get(entry.rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));

    if (!canonicalAnime) {
      try {
        const query = entry.searchQuery || entry.rawTitle;
        const res = await AniListService.resolveAndUpsertByTitle(query, entry.rawTitle);
        if (res.success && res.anime) {
          canonicalAnime = res.anime;
          animeById.set(canonicalAnime._id.toString(), canonicalAnime);
          animeBySlug.set(canonicalAnime.slug, canonicalAnime);
          console.log(`  -> Resolved canonical metadata: "${canonicalAnime.title}" (${canonicalAnime.slug})`);
        } else {
          console.warn(`  ⚠ AniList lookup failed: ${res.error}. Skipping discovery.`);
          continue;
        }
      } catch (err) {
        console.warn(`  ⚠ AniList error: ${(err as Error).message}. Skipping.`);
        continue;
      }
    } else {
      console.log(`  -> Canonical anime in local cache: "${canonicalAnime.title}"`);
    }

    if (stopDueToQuota) {
      console.log('  -> YouTube discovery paused due to API quota.');
      continue;
    }

    const publisherInfo = PUBLISHER_CHANNELS[entry.suggestedPublisher];
    if (!publisherInfo) {
      console.warn(`  ⚠ No official channel mapping found for "${entry.suggestedPublisher}"`);
      continue;
    }

    // Discover Playlists & Videos
    let videos: YouTubeVideoItem[] = [];
    let discoveredPlaylistId: string | undefined;

    try {
      const playlistQuery =
        entry.claimedLanguage === 'Hindi'
          ? `${entry.rawTitle} Hindi`
          : entry.rawTitle;

      const playlistRes = await YouTubeService.searchPlaylists(
        publisherInfo.channelId,
        playlistQuery,
        5
      );

      if (playlistRes.error && playlistRes.error.toLowerCase().includes('quota')) {
        stopDueToQuota = true;
        console.warn('  ! YouTube API Quota Exhausted.');
        break;
      }

      const matchingPlaylists = (playlistRes.playlists || []).filter((pl) => {
        const plTitle = pl.title.toLowerCase();
        const target = entry.rawTitle.toLowerCase();
        const words = target.split(/\s+/).filter((w) => w.length > 2);
        return plTitle.includes(target) || (words.length > 0 && words.every((w) => plTitle.includes(w)));
      });

      if (matchingPlaylists.length > 0) {
        for (const pl of matchingPlaylists) {
          discoveredPlaylistId = pl.playlistId;
          const plVideosRes = await YouTubeService.fetchPlaylistVideos(pl.playlistId, 100, true);
          if (plVideosRes.videos && plVideosRes.videos.length > 0) {
            console.log(`  -> Found playlist "${pl.title}" with ${plVideosRes.videos.length} videos`);
            videos.push(...plVideosRes.videos);
          }
        }
      }
    } catch (plErr) {
      console.warn(`  ⚠ Playlist search error:`, (plErr as Error).message);
    }

    // Fallback: Targeted Channel Video Search if no playlist found
    if (videos.length === 0 && !stopDueToQuota) {
      try {
        const searchQuery =
          entry.claimedLanguage === 'Hindi'
            ? `${entry.rawTitle} Hindi Dub Episode`
            : `${entry.rawTitle} Episode`;

        const res = await YouTubeService.searchChannelVideos(
          publisherInfo.channelId,
          searchQuery,
          25
        );

        if (res.error && res.error.toLowerCase().includes('quota')) {
          stopDueToQuota = true;
          console.warn('  ! YouTube API Quota Exhausted during channel search.');
          break;
        }

        if (res.videos && res.videos.length > 0) {
          videos = res.videos;
          console.log(`  -> Discovered ${videos.length} videos via channel search`);
        }
      } catch (sErr) {
        console.warn(`  ⚠ Channel search error:`, (sErr as Error).message);
      }
    }

    if (videos.length === 0) {
      console.log(`  -> No public videos found for "${entry.rawTitle}" on ${publisherInfo.channelName}`);
      continue;
    }

    // Process and add videos
    const uniqueVideos = Array.from(new Map(videos.map((v) => [v.videoId, v])).values());
    let episodesAddedForAnime = 0;

    for (let pos = 0; pos < uniqueVideos.length; pos++) {
      const vid = uniqueVideos[pos];
      if (!vid.videoId) continue;
      if (!YouTubeService.isFullEpisode(vid.title)) continue;

      const audioLanguage = detectAudioLanguage(vid.title, entry.claimedLanguage, publisherInfo.channelName);
      const parsed = parseSeasonAndEpisode(vid.title, entry.expectedSeason || 1);
      const seasonNumber = parsed.season;
      const episodeNumber = parsed.episode || pos + 1;

      // Version lookup or create
      const versionKey = `${canonicalAnime._id.toString()}_${audioLanguage}`;
      let version = versionMap.get(versionKey);

      if (!version) {
        version = await AnimeVersion.create({
          anime: canonicalAnime._id,
          audioLanguage,
          languageCode: audioLanguage.toLowerCase().slice(0, 2),
          channelName: publisherInfo.channelName,
          verificationStatus: 'verified',
          verifiedAt: new Date(),
          verificationNotes: `Auto-published from official channel ${publisherInfo.channelName}`,
        });
        versionMap.set(versionKey, version);
      }

      const vidKey = `${version._id.toString()}_${vid.videoId}`;
      const numKey = `${version._id.toString()}_${seasonNumber}_${episodeNumber}`;

      if (!epByVideoId.has(vidKey) && !epBySeasonAndNum.has(numKey)) {
        try {
          await Episode.create({
            anime: canonicalAnime._id,
            version: version._id,
            seasonNumber,
            episodeNumber,
            title: vid.title,
            youtubeVideoId: vid.videoId,
            playlistId: vid.playlistId || discoveredPlaylistId,
            duration: '24:00',
            thumbnail: vid.thumbnailUrl || `https://img.youtube.com/vi/${vid.videoId}/hqdefault.jpg`,
            sourceChannelName: publisherInfo.channelName,
            sourceChannelId: publisherInfo.channelId,
            verificationStatus: 'verified',
            isPublished: true,
            isEmbeddable: true,
            verifiedAt: new Date(),
            verifiedBy: 'Bulk Importer',
            lastAvailabilityCheckAt: new Date(),
          });
          epByVideoId.add(vidKey);
          epBySeasonAndNum.add(numKey);
          episodesAddedForAnime++;
          totalEpisodesAdded++;
        } catch (epErr) {
          // If collision, assign next sequential episode number in season
          try {
            const nextEp = (await Episode.countDocuments({ version: version._id, seasonNumber })) + 1;
            await Episode.create({
              anime: canonicalAnime._id,
              version: version._id,
              seasonNumber,
              episodeNumber: nextEp,
              title: vid.title,
              youtubeVideoId: vid.videoId,
              playlistId: vid.playlistId || discoveredPlaylistId,
              duration: '24:00',
              thumbnail: vid.thumbnailUrl || `https://img.youtube.com/vi/${vid.videoId}/hqdefault.jpg`,
              sourceChannelName: publisherInfo.channelName,
              sourceChannelId: publisherInfo.channelId,
              verificationStatus: 'verified',
              isPublished: true,
              isEmbeddable: true,
              verifiedAt: new Date(),
              verifiedBy: 'Bulk Importer',
              lastAvailabilityCheckAt: new Date(),
            });
            epByVideoId.add(vidKey);
            epBySeasonAndNum.add(`${version._id.toString()}_${seasonNumber}_${nextEp}`);
            episodesAddedForAnime++;
            totalEpisodesAdded++;
          } catch {}
        }
      }
    }

    // Recalculate verifiedEpisodeCount
    const count = await Episode.countDocuments({
      anime: canonicalAnime._id,
      isPublished: true,
      verificationStatus: 'verified',
    });
    canonicalAnime.verifiedEpisodeCount = count;
    await canonicalAnime.save();

    if (episodesAddedForAnime > 0) {
      totalAnimeAdded++;
      console.log(`  ✓ Published ${episodesAddedForAnime} episodes for "${canonicalAnime.title}" (Total Episodes: ${count})`);
    }

    await new Promise((r) => setTimeout(r, 150));
  }

  // Final Step: Global Recalculation & Cache Invalidation
  console.log('\n--- Step 3: Finalizing Global Recalculation & Cache Clearing ---');
  const allAnime = await Anime.find({});
  for (const a of allAnime) {
    const epCount = await Episode.countDocuments({
      anime: a._id,
      isPublished: true,
      verificationStatus: 'verified',
    });
    if (a.verifiedEpisodeCount !== epCount) {
      a.verifiedEpisodeCount = epCount;
      await a.save();
    }
  }

  CatalogueService.clearCache();

  console.log('\n=============================================');
  console.log('         BULK IMPORT COMPLETE REPORT         ');
  console.log('=============================================');
  console.log(`Total Anime With New Episodes: ${totalAnimeAdded}`);
  console.log(`Total New Episodes Published: ${totalEpisodesAdded}`);
  console.log(`Total Anime in Catalogue: ${await Anime.countDocuments()}`);
  console.log(`Total Anime With Playable Episodes: ${await Anime.countDocuments({ verifiedEpisodeCount: { $gt: 0 } })}`);
  console.log(`Total Playable Episodes in DB: ${await Episode.countDocuments({ isPublished: true, verificationStatus: 'verified' })}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Fatal error during bulk import:', err);
  process.exit(1);
});
