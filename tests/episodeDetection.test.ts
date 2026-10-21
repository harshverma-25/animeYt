import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { connectToDatabase } from '../src/lib/db/mongodb';
import mongoose from 'mongoose';
import { Anime } from '../src/lib/db/models/Anime';
import { Episode } from '../src/lib/db/models/Episode';
import { SourceChannel } from '../src/lib/db/models/SourceChannel';
import { YouTubeCandidate } from '../src/lib/db/models/YouTubeCandidate';
import { ImportJob } from '../src/lib/db/models/ImportJob';
import {
  AutoEpisodeDetectionService,
  YouTubeAtomFeedAdapter,
  ISourceFeedAdapter,
  DiscoveredFeedItem,
} from '../src/lib/services/autoEpisodeDetectionService';
import { CatalogueService } from '../src/lib/services/catalogueService';

describe('AnimeYT Automatic New Episode Detection Tests', () => {
  let testAnime: any;
  let testSource: any;

  before(async () => {
    await connectToDatabase();

    // Clean up any previous test artifacts
    await Episode.deleteMany({ sourceChannelId: 'UC_TEST_DISTRIBUTOR_001' });
    await YouTubeCandidate.deleteMany({ channelId: 'UC_TEST_DISTRIBUTOR_001' });
    await SourceChannel.deleteOne({ channelId: 'UC_TEST_DISTRIBUTOR_001' });
    await Anime.deleteOne({ slug: 'test-detection-anime' });
    await ImportJob.deleteMany({ jobType: 'automatic_episode_detection' });

    // Create a tracked test anime
    testAnime = await Anime.create({
      title: 'Legend of the Sky Blade',
      englishTitle: 'Sky Blade Chronicles',
      slug: 'test-detection-anime',
      synopsis: 'A brave warrior embarks on a journey across floating islands.',
      poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
      genres: ['Action', 'Fantasy'],
      releaseYear: 2024,
      status: 'Ongoing',
      popularityScore: 92,
      verifiedEpisodeCount: 0,
    });

    // Create a tracked verified distributor source channel
    testSource = await SourceChannel.create({
      channelId: 'UC_TEST_DISTRIBUTOR_001',
      channelName: 'Official Anime Distro IN',
      customUrl: 'https://youtube.com/@OfficialAnimeDistroIN',
      sourceUrl: 'https://youtube.com/@OfficialAnimeDistroIN',
      feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC_TEST_DISTRIBUTOR_001',
      languages: ['Hindi'],
      trackedAnimeSlugs: ['test-detection-anime'],
      officialSourceVerificationStatus: 'verified',
      isEnabled: true,
    });
  });

  after(async () => {
    await Episode.deleteMany({ sourceChannelId: 'UC_TEST_DISTRIBUTOR_001' });
    await YouTubeCandidate.deleteMany({ channelId: 'UC_TEST_DISTRIBUTOR_001' });
    await SourceChannel.deleteOne({ channelId: 'UC_TEST_DISTRIBUTOR_001' });
    await Anime.deleteOne({ slug: 'test-detection-anime' });
    await ImportJob.deleteMany({ jobType: 'automatic_episode_detection' });
    await mongoose.disconnect();
  });

  test('1. Season and Episode Parser extracts exact numbers and rejects missing numbers', () => {
    // Exact standard pattern
    const res1 = AutoEpisodeDetectionService.parseSeasonAndEpisode('[Hindi Dub] Legend of the Sky Blade - Episode 05 | Official');
    assert.equal(res1.seasonNumber, 1);
    assert.equal(res1.episodeNumber, 5);

    // Multi-season pattern S2E08
    const res2 = AutoEpisodeDetectionService.parseSeasonAndEpisode('Sky Blade Chronicles S2E08 [Eng Dub]');
    assert.equal(res2.seasonNumber, 2);
    assert.equal(res2.episodeNumber, 8);

    // Missing episode number: MUST NOT invent episode 1
    const res3 = AutoEpisodeDetectionService.parseSeasonAndEpisode('Legend of the Sky Blade Special Cast Interview');
    assert.equal(res3.episodeNumber, null, 'Must return null when no episode number is present');
  });

  test('2. Language Inference strictly distinguishes Hindi vs English and flags unknown languages', () => {
    // Explicit Hindi tag
    const langHindi = AutoEpisodeDetectionService.inferLanguage(
      '[Hindi Dub] Legend of the Sky Blade - Episode 01',
      ['Hindi'],
      'Muse India'
    );
    assert.equal(langHindi, 'Hindi');

    // Explicit English tag
    const langEng = AutoEpisodeDetectionService.inferLanguage(
      '[ENG DUB] Sky Blade Chronicles - Ep 01',
      ['English'],
      'VIZ Media'
    );
    assert.equal(langEng, 'English');

    // Unsupported language (e.g. Telugu, Tamil, Japanese)
    const langTelugu = AutoEpisodeDetectionService.inferLanguage(
      '[Telugu Dub] SPYxFAMILY - Episode 50',
      ['Hindi'],
      'Muse India'
    );
    assert.equal(langTelugu, 'Unknown', 'Unsupported languages must return Unknown');

    const langJp = AutoEpisodeDetectionService.inferLanguage(
      'Sky Blade - Episode 01 [Japanese Audio]',
      ['Hindi'],
      'Distro'
    );
    assert.equal(langJp, 'Unknown', 'Japanese audio uploads must return Unknown');
  });

  test('3. Trailer, shorts, compilation, and promo filtering', () => {
    assert.equal(AutoEpisodeDetectionService.isValidEpisodeUpload('Legend of the Sky Blade - Episode 01 [Hindi]'), true);
    assert.equal(AutoEpisodeDetectionService.isValidEpisodeUpload('Legend of the Sky Blade Official Trailer 1'), false);
    assert.equal(AutoEpisodeDetectionService.isValidEpisodeUpload('Sky Blade - Episode 02 #shorts'), false);
    assert.equal(AutoEpisodeDetectionService.isValidEpisodeUpload('Legend of the Sky Blade Full Season Compilation'), false);
    assert.equal(AutoEpisodeDetectionService.isValidEpisodeUpload('Legend of the Sky Blade Character Teaser PV'), false);
  });

  test('4. Full scan imports confident episode and updates public catalogue', async () => {
    // Mock adapter providing a valid episode upload
    const mockFeedItem: DiscoveredFeedItem = {
      videoId: 'TEST_VID_001_A',
      title: '[Hindi Dub] Legend of the Sky Blade - Episode 01 | Official',
      description: 'Official episode 1 licensed stream',
      publishedAt: new Date(),
      channelId: testSource.channelId,
      channelTitle: testSource.channelName,
      thumbnailUrl: 'https://img.youtube.com/vi/TEST_VID_001_A/hqdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=TEST_VID_001_A',
    };

    const mockAdapter: ISourceFeedAdapter = {
      fetchFeed: async () => [mockFeedItem],
    };

    const scanResult = await AutoEpisodeDetectionService.runFullScan({
      sourceId: testSource._id.toString(),
      adapter: mockAdapter,
      verifyAvailabilityFn: async () => ({ isAvailable: true, isEmbeddable: true, status: 'verified' }),
    });

    assert.equal(scanResult.sourcesScanned, 1);
    assert.equal(scanResult.newUploadsDiscovered, 1);
    assert.equal(scanResult.episodesImported, 1);
    assert.equal(scanResult.duplicatesSkipped, 0);

    // Verify episode in DB
    const ep = await Episode.findOne({ youtubeVideoId: 'TEST_VID_001_A' });
    assert.ok(ep, 'Episode should be inserted in DB');
    assert.equal(ep.episodeNumber, 1);
    assert.equal(ep.seasonNumber, 1);
    assert.equal(ep.isPublished, true);
    assert.equal(ep.verificationStatus, 'verified');
    assert.equal(ep.languageCode, 'hi');
    assert.equal(ep.videoUrl, 'https://www.youtube.com/watch?v=TEST_VID_001_A');

    // Verify Anime verifiedEpisodeCount was updated
    const updatedAnime = await Anime.findById(testAnime._id);
    assert.equal(updatedAnime?.verifiedEpisodeCount, 1);

    // Verify episode is visible in public catalogue API
    const publicEpisodes = await CatalogueService.getEpisodesForAnime(testAnime.slug, { audioLanguage: 'Hindi' });
    assert.equal(publicEpisodes.length, 1);
    assert.equal(publicEpisodes[0].youtubeVideoId, 'TEST_VID_001_A');
  });

  test('5. Duplicate detection skips already published episode on subsequent scan', async () => {
    const mockFeedItem: DiscoveredFeedItem = {
      videoId: 'TEST_VID_001_A', // Same video ID as test 4
      title: '[Hindi Dub] Legend of the Sky Blade - Episode 01 | Official',
      description: 'Official episode 1 licensed stream',
      publishedAt: new Date(),
      channelId: testSource.channelId,
      channelTitle: testSource.channelName,
      thumbnailUrl: 'https://img.youtube.com/vi/TEST_VID_001_A/hqdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=TEST_VID_001_A',
    };

    const mockAdapter: ISourceFeedAdapter = {
      fetchFeed: async () => [mockFeedItem],
    };

    const scanResult = await AutoEpisodeDetectionService.runFullScan({
      sourceId: testSource._id.toString(),
      adapter: mockAdapter,
      verifyAvailabilityFn: async () => ({ isAvailable: true, isEmbeddable: true, status: 'verified' }),
    });

    assert.equal(scanResult.sourcesScanned, 1);
    assert.equal(scanResult.newUploadsDiscovered, 1);
    assert.equal(scanResult.episodesImported, 0, 'Should NOT import duplicate');
    assert.equal(scanResult.duplicatesSkipped, 1, 'Should record duplicate skipped');

    // Ensure only 1 episode exists
    const count = await Episode.countDocuments({ youtubeVideoId: 'TEST_VID_001_A' });
    assert.equal(count, 1);
  });

  test('6. Missing episode number routes upload to candidate review queue', async () => {
    const mockFeedItem: DiscoveredFeedItem = {
      videoId: 'TEST_VID_NO_EP',
      title: '[Hindi Dub] Legend of the Sky Blade Special OVA | Official',
      description: 'Special OVA stream without standard episode numbering',
      publishedAt: new Date(),
      channelId: testSource.channelId,
      channelTitle: testSource.channelName,
      thumbnailUrl: 'https://img.youtube.com/vi/TEST_VID_NO_EP/hqdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=TEST_VID_NO_EP',
    };

    const mockAdapter: ISourceFeedAdapter = {
      fetchFeed: async () => [mockFeedItem],
    };

    const scanResult = await AutoEpisodeDetectionService.runFullScan({
      sourceId: testSource._id.toString(),
      adapter: mockAdapter,
    });

    assert.equal(scanResult.episodesImported, 0, 'Ambiguous upload must not be auto-published');
    assert.equal(scanResult.itemsAwaitingReview, 1, 'Must place item in review queue');

    const candidate = await YouTubeCandidate.findOne({ youtubeVideoId: 'TEST_VID_NO_EP' });
    assert.ok(candidate, 'Candidate must exist in review queue');
    assert.equal(candidate.verificationStatus, 'pending_review');
    assert.ok(candidate.reviewerNotes?.includes('Episode number could not be reliably extracted'));
  });

  test('7. Ambiguous or unknown anime match routes upload to review queue', async () => {
    const mockFeedItem: DiscoveredFeedItem = {
      videoId: 'TEST_VID_UNKNOWN_ANIME',
      title: '[Hindi Dub] Unknown Space Rangers - Episode 01',
      description: 'An anime not tracked in catalogue',
      publishedAt: new Date(),
      channelId: testSource.channelId,
      channelTitle: testSource.channelName,
      thumbnailUrl: 'https://img.youtube.com/vi/TEST_VID_UNKNOWN_ANIME/hqdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=TEST_VID_UNKNOWN_ANIME',
    };

    const mockAdapter: ISourceFeedAdapter = {
      fetchFeed: async () => [mockFeedItem],
    };

    const scanResult = await AutoEpisodeDetectionService.runFullScan({
      sourceId: testSource._id.toString(),
      adapter: mockAdapter,
    });

    assert.equal(scanResult.episodesImported, 0);
    assert.equal(scanResult.itemsAwaitingReview, 1);

    const candidate = await YouTubeCandidate.findOne({ youtubeVideoId: 'TEST_VID_UNKNOWN_ANIME' });
    assert.ok(candidate);
    assert.equal(candidate.verificationStatus, 'pending_review');
    assert.ok(candidate.reviewerNotes?.includes('Anime match could not be determined'));
  });

  test('8. Concurrency lock prevents duplicate simultaneous scans', async () => {
    // Create an artificial active running job
    const activeLockJob = await ImportJob.create({
      dataSource: 'youtube',
      jobType: 'automatic_episode_detection',
      status: 'running',
      startedAt: new Date(),
      progress: 50,
    });

    const concurrentResult = await AutoEpisodeDetectionService.runFullScan({
      sourceId: testSource._id.toString(),
    });

    assert.equal(concurrentResult.skipped, true);
    assert.ok(concurrentResult.reason?.includes('already running'));

    // Cleanup artificial job
    await ImportJob.deleteOne({ _id: activeLockJob._id });
  });

  test('9. Feed failures are caught, logged, and update source lastError', async () => {
    const failingAdapter: ISourceFeedAdapter = {
      fetchFeed: async () => {
        throw new Error('Simulated network timeout (ETIMEDOUT)');
      },
    };

    const scanResult = await AutoEpisodeDetectionService.runFullScan({
      sourceId: testSource._id.toString(),
      adapter: failingAdapter,
    });

    assert.equal(scanResult.failedCount, 1);
    assert.equal(scanResult.errors.length, 1);
    assert.ok(scanResult.errors[0].error.includes('ETIMEDOUT'));

    // Check that source channel recorded the error
    const sourceInDb = await SourceChannel.findById(testSource._id);
    assert.ok(sourceInDb?.lastError?.includes('ETIMEDOUT'));
  });

  test('10. Atom XML Parser extracts all fields correctly from real syndication XML', () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>yt:video:dQw4w9WgXcQ</id>
    <yt:videoId>dQw4w9WgXcQ</yt:videoId>
    <yt:channelId>UCYYhAzgWuxPauRXdPpLAX3Q</yt:channelId>
    <title>[Hindi Dub] Legend of the Sky Blade - Episode 02</title>
    <published>2026-10-21T08:00:00+00:00</published>
    <updated>2026-10-21T08:05:00+00:00</updated>
    <media:group>
      <media:title>[Hindi Dub] Legend of the Sky Blade - Episode 02</media:title>
      <media:thumbnail url="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" width="480" height="360"/>
      <media:description>Official episode release &amp; details</media:description>
    </media:group>
  </entry>
</feed>`;

    const adapter = new YouTubeAtomFeedAdapter();
    const items = adapter.parseAtomXml(sampleXml, 'UCYYhAzgWuxPauRXdPpLAX3Q', 'Muse India');

    assert.equal(items.length, 1);
    assert.equal(items[0].videoId, 'dQw4w9WgXcQ');
    assert.equal(items[0].title, '[Hindi Dub] Legend of the Sky Blade - Episode 02');
    assert.equal(items[0].description, 'Official episode release & details');
    assert.equal(items[0].thumbnailUrl, 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    assert.equal(items[0].videoUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });
});
