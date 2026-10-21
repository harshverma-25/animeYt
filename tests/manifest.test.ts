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
import { YouTubeService } from '../src/lib/services/youtubeService';

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

  test('YouTubeService episode filter correctly distinguishes full episodes from trailers/clips/PVs', () => {
    // Non-episode content
    assert.strictEqual(YouTubeService.isFullEpisode('DAN DA DAN | Official Trailer | Muse India'), false);
    assert.strictEqual(YouTubeService.isFullEpisode('Attack on Titan Season 4 Official Teaser PV 1'), false);
    assert.strictEqual(YouTubeService.isFullEpisode('Jujutsu Kaisen Episode 1-3 Recap'), false);
    assert.strictEqual(YouTubeService.isFullEpisode('Spy x Family Funny Moments Highlights'), false);
    assert.strictEqual(YouTubeService.isFullEpisode('Tokyo Revengers Special Announcement'), false);

    // Legitimate full episodes
    assert.strictEqual(YouTubeService.isFullEpisode('DAN DA DAN - Episode 01 [Hindi Dub] | Muse India'), true);
    assert.strictEqual(YouTubeService.isFullEpisode('Assassination Classroom S2 - Episode 15 [Hindi Dub]'), true);
    assert.strictEqual(YouTubeService.isFullEpisode('Attack on Titan Season 1 Episode 01 (English Dub)'), true);
    assert.strictEqual(YouTubeService.isFullEpisode('BOFURI: I Don\'t Want to Get Hurt, so I\'ll Max Out My Defense. - 01'), true);
  });

  test('YouTubeService parses season and episode numbers accurately from titles', () => {
    assert.strictEqual(YouTubeService.parseSeasonNumber('Assassination Classroom Season 2 Episode 05'), 2);
    assert.strictEqual(YouTubeService.parseSeasonNumber('Attack on Titan S3 Ep 10'), 3);
    assert.strictEqual(YouTubeService.parseSeasonNumber('DAN DA DAN Episode 01'), 1);

    assert.strictEqual(YouTubeService.parseEpisodeNumber('DAN DA DAN - Episode 04 [Hindi Dub]', 0), 4);
    assert.strictEqual(YouTubeService.parseEpisodeNumber('Attack on Titan S1 #12', 0), 12);
    assert.strictEqual(YouTubeService.parseEpisodeNumber('BOFURI Ep 08', 0), 8);
    assert.strictEqual(YouTubeService.parseEpisodeNumber('Random Title Without Number', 5), 6);
  });

  test('Multi-language versions can be published for the same anime with accurate aggregate counts', async () => {
    const multiLangAnime = await Anime.create({
      anilistId: 888995,
      title: 'Test Manifest Multi-Lang Anime',
      slug: 'test-manifest-multi-lang-anime',
      synopsis: 'Supports Hindi and Japanese versions simultaneously.',
      releaseYear: 2024,
      status: 'Ongoing',
      genres: ['Action', 'Fantasy'],
      verifiedEpisodeCount: 0,
    });

    const candHindi = await YouTubeCandidate.create({
      youtubeVideoId: 'test-manifest-vid-multi-hi-1',
      channelId: 'UCYYhAzgWuxPauRXdPpLAX3Q', // Muse India
      channelTitle: 'Muse India',
      videoTitle: 'Multi-Lang Ep 01 [Hindi Dub]',
      candidateAnimeId: multiLangAnime._id,
      candidateAnimeSlug: multiLangAnime.slug,
      candidateEpisodeNumber: 1,
      claimedLanguage: 'Hindi',
      verificationStatus: 'discovered',
    });

    const candJap = await YouTubeCandidate.create({
      youtubeVideoId: 'test-manifest-vid-multi-ja-1',
      channelId: 'UCGbshtvS9t-8CW11W7TooQg', // Muse Asia
      channelTitle: 'Muse Asia',
      videoTitle: 'Multi-Lang Ep 01 [English Sub]',
      candidateAnimeId: multiLangAnime._id,
      candidateAnimeSlug: multiLangAnime.slug,
      candidateEpisodeNumber: 1,
      claimedLanguage: 'Japanese',
      verificationStatus: 'discovered',
    });

    // Publish Hindi episode
    await VerificationService.verifyAndPublish({
      candidateId: candHindi._id.toString(),
      animeSlug: multiLangAnime.slug,
      episodeNumber: 1,
      episodeTitle: 'The Journey Begins [Hindi Dub]',
      audioLanguage: 'Hindi',
      reviewerName: 'Admin Reviewer',
    });

    // Publish Japanese episode
    await VerificationService.verifyAndPublish({
      candidateId: candJap._id.toString(),
      animeSlug: multiLangAnime.slug,
      episodeNumber: 1,
      episodeTitle: 'The Journey Begins [Japanese Audio]',
      audioLanguage: 'Japanese',
      reviewerName: 'Admin Reviewer',
    });

    // Check Anime details
    const details = await CatalogueService.getAnimeBySlug('test-manifest-multi-lang-anime');
    assert.ok(details);
    assert.strictEqual(details.verifiedEpisodeCount, 2, 'Aggregate verified episode count must equal 2');
    assert.strictEqual(details.versions.length, 2, 'Must have 2 distinct audio versions');
    assert.ok(details.availableAudioLanguages.includes('Hindi'));
    assert.ok(details.availableAudioLanguages.includes('Japanese'));

    // Check individual episodes by language
    const hindiEps = await CatalogueService.getEpisodesForAnime('test-manifest-multi-lang-anime', { audioLanguage: 'Hindi' });
    assert.strictEqual(hindiEps.length, 1);
    assert.strictEqual(hindiEps[0].youtubeVideoId, 'test-manifest-vid-multi-hi-1');

    const japEps = await CatalogueService.getEpisodesForAnime('test-manifest-multi-lang-anime', { audioLanguage: 'Japanese' });
    assert.strictEqual(japEps.length, 1);
    assert.strictEqual(japEps[0].youtubeVideoId, 'test-manifest-vid-multi-ja-1');

    // Clean up
    await Anime.deleteOne({ _id: multiLangAnime._id });
    await AnimeVersion.deleteMany({ anime: multiLangAnime._id });
    await Episode.deleteMany({ youtubeVideoId: { $in: ['test-manifest-vid-multi-hi-1', 'test-manifest-vid-multi-ja-1'] } });
    await YouTubeCandidate.deleteMany({ youtubeVideoId: { $in: ['test-manifest-vid-multi-hi-1', 'test-manifest-vid-multi-ja-1'] } });
  });

  test('ImportJob checkpoint persistence supports resuming an interrupted pipeline job', async () => {
    const checkpointData = {
      lastProcessedIndex: 14,
      lastProcessedManifestId: 15,
      processedSoFar: 15,
      publishedSoFar: 30,
    };

    const job = await ImportJob.create({
      dataSource: 'youtube',
      jobType: 'manifest_import',
      status: 'running',
      cursor: JSON.stringify(checkpointData),
      processedCount: 15,
      insertedCount: 30,
    });

    assert.ok(job._id);

    // Retrieve and verify checkpoint can be read and parsed
    const loadedJob = await ImportJob.findById(job._id);
    assert.ok(loadedJob);
    assert.ok(loadedJob.cursor);
    const parsed = JSON.parse(loadedJob.cursor);
    assert.strictEqual(parsed.lastProcessedIndex, 14);
    assert.strictEqual(parsed.processedSoFar, 15);

    await ImportJob.deleteOne({ _id: job._id });
  });

  test('Repeated candidate discoveries are idempotent and do not duplicate candidates', async () => {
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
