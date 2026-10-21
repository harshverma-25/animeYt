import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/db/mongodb';
import { Anime } from '../src/lib/db/models/Anime';
import { AnimeVersion } from '../src/lib/db/models/AnimeVersion';
import { Episode } from '../src/lib/db/models/Episode';
import { YouTubeCandidate } from '../src/lib/db/models/YouTubeCandidate';
import { EpisodeManagementService } from '../src/lib/services/episodeManagementService';
import { CatalogueService } from '../src/lib/services/catalogueService';
import {
  extractYouTubeVideoId,
  normalizeYouTubeUrl,
  extractPlaylistId,
} from '../src/lib/utils/youtubeUtils';

describe('Episode Management & Zero-API Data Pipeline Tests', () => {
  let testAnimeA: any;
  let testAnimeB: any;

  before(async () => {
    await connectToDatabase();

    // Clean up any test fixtures from previous runs
    await Anime.deleteMany({ slug: { $regex: /^test-ep-mgmt-/ } });
    await Episode.deleteMany({ youtubeVideoId: { $regex: /^tstmgmtep/ } });
    await YouTubeCandidate.deleteMany({ youtubeVideoId: { $regex: /^tstmgmtep/ } });

    // Create 2 test anime
    testAnimeA = await Anime.create({
      anilistId: 9988111,
      title: 'Test Episode Mgmt Anime A',
      slug: 'test-ep-mgmt-anime-a',
      synopsis: 'Test anime for episode management and imports.',
      releaseYear: 2024,
      status: 'Ongoing',
      genres: ['Action', 'Fantasy'],
      verifiedEpisodeCount: 0,
      popularityScore: 100,
    });

    testAnimeB = await Anime.create({
      anilistId: 9988112,
      title: 'Test Episode Mgmt Anime B',
      slug: 'test-ep-mgmt-anime-b',
      synopsis: 'Secondary test anime for cross-anime conflict detection.',
      releaseYear: 2024,
      status: 'Completed',
      genres: ['Sci-Fi'],
      verifiedEpisodeCount: 0,
      popularityScore: 90,
    });

    CatalogueService.clearCache();
  });

  after(async () => {
    // Cleanup
    await Anime.deleteMany({ slug: { $regex: /^test-ep-mgmt-/ } });
    await AnimeVersion.deleteMany({ anime: { $in: [testAnimeA._id, testAnimeB._id] } });
    await Episode.deleteMany({ youtubeVideoId: { $regex: /^tstmgmtep/ } });
    await YouTubeCandidate.deleteMany({ youtubeVideoId: { $regex: /^tstmgmtep/ } });
    CatalogueService.clearCache();
    await mongoose.disconnect();
  });

  // 1. URL Normalization
  test('extractYouTubeVideoId and normalizeYouTubeUrl handle all valid YouTube URL formats', () => {
    const rawId = 'dQw4w9WgXcQ';
    const formats = [
      'dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'http://youtube.com/watch?v=dQw4w9WgXcQ&t=42s',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ?t=10',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/live/dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
    ];

    for (const url of formats) {
      const extracted = extractYouTubeVideoId(url);
      assert.strictEqual(extracted, rawId, `Failed to extract from ${url}`);
      assert.strictEqual(normalizeYouTubeUrl(url), `https://www.youtube.com/watch?v=${rawId}`);
    }

    // Invalid formats
    assert.strictEqual(extractYouTubeVideoId(''), null);
    assert.strictEqual(extractYouTubeVideoId('invalid_url_without_id'), null);
    assert.strictEqual(extractYouTubeVideoId('https://example.com/not-youtube'), null);

    // Playlist ID extraction
    assert.strictEqual(
      extractPlaylistId('https://www.youtube.com/playlist?list=PL1234567890abcdef'),
      'PL1234567890abcdef'
    );
    assert.strictEqual(
      extractPlaylistId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1234567890abcdef'),
      'PL1234567890abcdef'
    );
  });

  // 2. Single Episode Creation & Auto-Publishing
  test('EpisodeManagementService.createEpisode adds, normalizes, and publishes episode record', async () => {
    const res = await EpisodeManagementService.createEpisode({
      animeSlugOrId: testAnimeA.slug,
      audioLanguage: 'Hindi',
      seasonNumber: 1,
      episodeNumber: 1,
      youtubeUrlOrId: 'https://www.youtube.com/watch?v=tstmgmtep01',
      title: 'The Awakening [Hindi]',
      isPublished: true,
      verificationStatus: 'verified',
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.episode.youtubeVideoId, 'tstmgmtep01');
    assert.strictEqual(res.episode.seasonNumber, 1);
    assert.strictEqual(res.episode.episodeNumber, 1);
    assert.strictEqual(res.episode.audioLanguage, 'Hindi');
    assert.strictEqual(res.episode.isPublished, true);
    assert.strictEqual(res.episode.thumbnail, 'https://img.youtube.com/vi/tstmgmtep01/hqdefault.jpg');

    // Verify Anime.verifiedEpisodeCount incremented to 1
    const updatedAnime = await Anime.findById(testAnimeA._id);
    assert.strictEqual(updatedAnime?.verifiedEpisodeCount, 1);
  });

  // 3. Duplicate Video ID and Episode Number Detection
  test('EpisodeManagementService detects and rejects duplicate episodes and conflicting video IDs', async () => {
    // Attempt duplicate episode number in same season & version with a different video ID
    await assert.rejects(
      async () => {
        await EpisodeManagementService.createEpisode({
          animeSlugOrId: testAnimeA.slug,
          audioLanguage: 'Hindi',
          seasonNumber: 1,
          episodeNumber: 1, // Already exists!
          youtubeUrlOrId: 'https://youtu.be/tstmgmtep02',
          title: 'Duplicate Episode 1',
        });
      },
      /Conflict: Episode 1 \(Season 1, Hindi\) already exists/
    );

    // Attempt duplicate video ID in same anime
    await assert.rejects(
      async () => {
        await EpisodeManagementService.createEpisode({
          animeSlugOrId: testAnimeA.slug,
          audioLanguage: 'Hindi',
          seasonNumber: 1,
          episodeNumber: 2,
          youtubeUrlOrId: 'tstmgmtep01', // Already mapped to Ep 1!
          title: 'Episode 2 with duplicate video ID',
        });
      },
      /Conflict: Video ID tstmgmtep01 is already added as Episode 1/
    );

    // Attempt cross-anime mapping conflict: map tstmgmtep01 to Anime B!
    await assert.rejects(
      async () => {
        await EpisodeManagementService.createEpisode({
          animeSlugOrId: testAnimeB.slug,
          audioLanguage: 'Japanese',
          seasonNumber: 1,
          episodeNumber: 1,
          youtubeUrlOrId: 'tstmgmtep01', // Already mapped to Anime A!
          title: 'Anime B Stealing Video ID',
        });
      },
      /Conflict: YouTube video ID tstmgmtep01 is already mapped to Test Episode Mgmt Anime A/
    );
  });

  // 4. Batch Import Workflow
  test('EpisodeManagementService.batchImportVideos imports list of video URLs with deduplication', async () => {
    const rawBatch = [
      'https://www.youtube.com/watch?v=tstmgmtep10',
      'https://youtu.be/tstmgmtep11',
      'tstmgmtep12',
      'https://www.youtube.com/watch?v=tstmgmtep10', // duplicate in batch
      'invalid-not-youtube-url', // invalid
    ];

    const result = await EpisodeManagementService.batchImportVideos({
      animeSlugOrId: testAnimeA.slug,
      audioLanguage: 'English',
      seasonNumber: 1,
      videoInputs: rawBatch,
      autoVerify: false, // Saves as candidate items awaiting review
    });

    assert.strictEqual(result.totalSubmitted, 5);
    assert.strictEqual(result.importedCount, 3); // 010, 011, 012
    assert.strictEqual(result.duplicateCount, 1); // 010 duplicate in batch
    assert.strictEqual(result.invalidCount, 1); // invalid

    // Re-importing the same list should detect all as existing duplicates
    const repeatedResult = await EpisodeManagementService.batchImportVideos({
      animeSlugOrId: testAnimeA.slug,
      audioLanguage: 'English',
      seasonNumber: 1,
      videoInputs: ['tstmgmtep10', 'tstmgmtep11'],
      autoVerify: false,
    });

    assert.strictEqual(repeatedResult.importedCount, 0);
    assert.strictEqual(repeatedResult.duplicateCount, 2);
  });

  // 5. Episode Update, Verification, and Publication Rules
  test('EpisodeManagementService.updateEpisode and deleteEpisode enforce publication rules', async () => {
    // Create an unverified draft episode
    const created = await EpisodeManagementService.createEpisode({
      animeSlugOrId: testAnimeB.slug,
      audioLanguage: 'Japanese',
      seasonNumber: 1,
      episodeNumber: 1,
      youtubeUrlOrId: 'tstmgmtep20',
      title: 'Anime B Draft Episode',
      isPublished: false,
      verificationStatus: 'unverified',
    });

    assert.strictEqual(created.episode.isPublished, false);
    assert.strictEqual(created.episode.verificationStatus, 'unverified');

    // Rule: Cannot publish an episode while unverified or unavailable
    await assert.rejects(
      async () => {
        await EpisodeManagementService.updateEpisode(created.episode.id, {
          isPublished: true,
        });
      },
      /Cannot publish an episode that is not verified/
    );

    // Verify and publish
    const updated = await EpisodeManagementService.updateEpisode(created.episode.id, {
      verificationStatus: 'verified',
      isPublished: true,
      title: 'Anime B Official Episode 1',
    });

    assert.strictEqual(updated.episode.verificationStatus, 'verified');
    assert.strictEqual(updated.episode.isPublished, true);
    assert.strictEqual(updated.episode.title, 'Anime B Official Episode 1');

    // Delete episode
    const delRes = await EpisodeManagementService.deleteEpisode(created.episode.id);
    assert.strictEqual(delRes.success, true);

    const checkDeleted = await Episode.findById(created.episode.id);
    assert.strictEqual(checkDeleted, null);
  });

  // 6. Catalogue Caching & Language Switching without YouTube API
  test('CatalogueService responses are cached in memory and invalidate on mutations', async () => {
    CatalogueService.clearCache();

    // Query catalogue
    const cat1 = await CatalogueService.getCatalogue({ query: 'Test Episode Mgmt Anime A' });
    assert.ok(cat1.items.length > 0);

    // Query episodes for anime
    const epListHindi = await CatalogueService.getEpisodesForAnime(testAnimeA.slug, {
      audioLanguage: 'Hindi',
    });
    assert.strictEqual(epListHindi.length, 1);
    assert.strictEqual(epListHindi[0].youtubeVideoId, 'tstmgmtep01');

    // Add Episode 2 for Hindi version to verify cache invalidation
    await EpisodeManagementService.createEpisode({
      animeSlugOrId: testAnimeA.slug,
      audioLanguage: 'Hindi',
      seasonNumber: 1,
      episodeNumber: 2,
      youtubeUrlOrId: 'tstmgmtep02',
      title: 'Episode 2 [Hindi]',
      isPublished: true,
      verificationStatus: 'verified',
    });

    // Query again - should return fresh data with 2 Hindi episodes
    const epListHindiUpdated = await CatalogueService.getEpisodesForAnime(testAnimeA.slug, {
      audioLanguage: 'Hindi',
    });
    assert.strictEqual(epListHindiUpdated.length, 2);
  });
});
