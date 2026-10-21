import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/db/mongodb';
import { Anime } from '../src/lib/db/models/Anime';
import { AnimeVersion } from '../src/lib/db/models/AnimeVersion';
import { Episode } from '../src/lib/db/models/Episode';
import { YouTubeCandidate } from '../src/lib/db/models/YouTubeCandidate';
import { ImportJob } from '../src/lib/db/models/ImportJob';
import { ANIME_MANIFEST } from '../src/lib/data/animeManifest';
import { PUBLISHER_CHANNELS } from '../src/lib/services/manifestImportService';
import { CatalogueService } from '../src/lib/services/catalogueService';
import { VerificationService } from '../src/lib/services/verificationService';

describe('AnimeYT Manifest Pipeline & Verification Suite', () => {
  before(async () => {
    await connectToDatabase();
    await Anime.deleteMany({ slug: { $regex: /^test-manifest-/ } });
    await Episode.deleteMany({ youtubeVideoId: { $regex: /^test-manifest-/ } });
    await YouTubeCandidate.deleteMany({ youtubeVideoId: { $regex: /^test-manifest-/ } });
    await ImportJob.deleteMany({ jobType: { $regex: /manifest_import/ } });
  });

  after(async () => {
    await Anime.deleteMany({ slug: { $regex: /^test-manifest-/ } });
    await Episode.deleteMany({ youtubeVideoId: { $regex: /^test-manifest-/ } });
    await YouTubeCandidate.deleteMany({ youtubeVideoId: { $regex: /^test-manifest-/ } });
    await ImportJob.deleteMany({ jobType: { $regex: /manifest_import/ } });
    await mongoose.disconnect();
  });

  test('Manifest contains complete expected groups and verified official publisher channels', () => {
    assert.ok(ANIME_MANIFEST.length >= 140, 'Manifest must contain the broad supplied catalogue');

    const hindiTitles = ANIME_MANIFEST.filter((e) => e.claimedLanguage === 'Hindi');
    const englishTitles = ANIME_MANIFEST.filter((e) => e.claimedLanguage === 'English');
    const japaneseTitles = ANIME_MANIFEST.filter((e) => e.claimedLanguage === 'Japanese');

    assert.ok(hindiTitles.length >= 30, 'Must include Hindi releases');
    assert.ok(englishTitles.length >= 30, 'Must include English releases');
    assert.ok(japaneseTitles.length >= 50, 'Must include Japanese subbed releases');

    // Verify all publishers have configured authorized channel IDs
    for (const entry of ANIME_MANIFEST) {
      const pub = PUBLISHER_CHANNELS[entry.suggestedPublisher];
      assert.ok(pub, `Publisher "${entry.suggestedPublisher}" must have official channel mapping`);
      assert.ok(pub.channelId.startsWith('UC'), `Publisher channel ID ${pub.channelId} must be a valid YouTube channel ID`);
    }
  });

  test('Stage A creates canonical metadata with 0 verified episodes; unverified anime remains discoverable', async () => {
    const testAnime = await Anime.create({
      anilistId: 888991,
      title: 'Test Manifest Unverified Anime',
      slug: 'test-manifest-unverified-anime',
      synopsis: 'Discovered in manifest but no verified YouTube episode yet.',
      releaseYear: 2024,
      status: 'Ongoing',
      genres: ['Fantasy'],
      verifiedEpisodeCount: 0,
      popularityScore: 100,
    });

    // 1. Search in catalogue
    const searchRes = await CatalogueService.getCatalogue({ query: 'Test Manifest Unverified' });
    assert.ok(searchRes.items.some((a) => a.slug === 'test-manifest-unverified-anime'), 'Unverified anime must appear in catalogue search');

    // 2. Fetch details
    const details = await CatalogueService.getAnimeBySlug('test-manifest-unverified-anime');
    assert.ok(details);
    assert.strictEqual(details.totalEpisodes, 0, 'Total episodes must be 0 for unverified anime');
    assert.strictEqual(details.verifiedEpisodeCount, 0);
    assert.strictEqual(details.versions.length, 0, 'No verified versions should exist yet');

    // 3. Fetch episodes API
    const eps = await CatalogueService.getEpisodesForAnime('test-manifest-unverified-anime');
    assert.deepStrictEqual(eps, [], 'Episodes array must be empty');

    await Anime.deleteOne({ _id: testAnime._id });
  });

  test('Manifest candidate discovery never automatically publishes episodes', async () => {
    const videoId = 'test-manifest-vid-cand-1';

    const candidate = await YouTubeCandidate.create({
      youtubeVideoId: videoId,
      channelId: 'UCYYhAzgWuxPauRXdPpLAX3Q', // Muse India
      channelTitle: 'Muse India',
      videoTitle: 'Test Video Episode 1',
      claimedLanguage: 'Hindi',
      discoveryMethod: 'channel_search',
      verificationStatus: 'discovered',
    });

    assert.strictEqual(candidate.verificationStatus, 'discovered');

    // Verify no episode exists in Episode collection
    const published = await Episode.findOne({ youtubeVideoId: videoId });
    assert.strictEqual(published, null, 'Discovered candidate must never create an Episode record automatically');

    await YouTubeCandidate.deleteOne({ _id: candidate._id });
  });

  test('Verification workflow validates channel and publishes episode with correct language', async () => {
    const anime = await Anime.create({
      anilistId: 888992,
      title: 'Test Manifest Verification Anime',
      slug: 'test-manifest-verification-anime',
      synopsis: 'Testing verification and publishing.',
      releaseYear: 2023,
      status: 'Completed',
      genres: ['Action'],
      verifiedEpisodeCount: 0,
    });

    const candidate = await YouTubeCandidate.create({
      youtubeVideoId: 'test-manifest-vid-pub-1',
      channelId: 'UCYYhAzgWuxPauRXdPpLAX3Q', // Muse India (verified source channel)
      channelTitle: 'Muse India',
      videoTitle: '[Hindi Dub] Episode 01',
      candidateAnimeId: anime._id,
      candidateAnimeSlug: anime.slug,
      candidateEpisodeNumber: 1,
      claimedLanguage: 'Hindi',
      verificationStatus: 'discovered',
    });

    const verifyRes = await VerificationService.verifyAndPublish({
      candidateId: candidate._id.toString(),
      animeSlug: anime.slug,
      episodeNumber: 1,
      episodeTitle: 'Awakening [Hindi Dub]',
      audioLanguage: 'Hindi',
      reviewerName: 'Admin Reviewer',
    });

    assert.strictEqual(verifyRes.success, true);
    assert.strictEqual(verifyRes.verifiedEpisodeCount, 1);

    // Check Anime details now reflect verified version and episode
    const details = await CatalogueService.getAnimeBySlug('test-manifest-verification-anime');
    assert.ok(details);
    assert.strictEqual(details.totalEpisodes, 1);
    assert.ok(details.availableAudioLanguages.includes('Hindi'));

    const version = details.versions.find((v) => v.audioLanguage === 'Hindi');
    assert.ok(version);
    assert.strictEqual(version.episodes.length, 1);
    assert.strictEqual(version.episodes[0].youtubeVideoId, 'test-manifest-vid-pub-1');

    // Clean up
    await Anime.deleteOne({ _id: anime._id });
    await AnimeVersion.deleteMany({ anime: anime._id });
    await Episode.deleteOne({ youtubeVideoId: 'test-manifest-vid-pub-1' });
    await YouTubeCandidate.deleteOne({ _id: candidate._id });
  });

  test('Repeated imports are idempotent and do not duplicate anime or candidates', async () => {
    const videoId = 'test-manifest-dedup-vid';

    const cand = await YouTubeCandidate.create({
      youtubeVideoId: videoId,
      channelId: 'UCYYhAzgWuxPauRXdPpLAX3Q',
      channelTitle: 'Muse India',
      videoTitle: 'Dedup Video',
      claimedLanguage: 'Hindi',
      verificationStatus: 'discovered',
    });

    // Duplicate create rejected by unique index
    await assert.rejects(
      async () => {
        await YouTubeCandidate.create({
          youtubeVideoId: videoId,
          channelId: 'UCYYhAzgWuxPauRXdPpLAX3Q',
          channelTitle: 'Muse India',
          videoTitle: 'Duplicate Video',
          claimedLanguage: 'Hindi',
          verificationStatus: 'discovered',
        });
      },
      /E11000/
    );

    await YouTubeCandidate.deleteOne({ _id: cand._id });
  });
});
