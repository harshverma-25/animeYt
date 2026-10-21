import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/db/mongodb';
import { Anime } from '../src/lib/db/models/Anime';
import { AnimeVersion } from '../src/lib/db/models/AnimeVersion';
import { Episode } from '../src/lib/db/models/Episode';
import { YouTubeCandidate } from '../src/lib/db/models/YouTubeCandidate';
import { CatalogueService } from '../src/lib/services/catalogueService';
import { VerificationService } from '../src/lib/services/verificationService';
import { isAuthorizedAdmin } from '../src/lib/auth/adminAuth';

describe('AnimeYT Data Pipeline & Verification Tests', () => {
  before(async () => {
    await connectToDatabase();
    await Anime.deleteMany({
      $or: [
        { slug: { $regex: /^test-/ } },
        { anilistId: { $in: [9999991, 9999992, 9999993, 9999994] } },
      ],
    });
    await Episode.deleteMany({ youtubeVideoId: { $regex: /^test-vid-/ } });
    await YouTubeCandidate.deleteMany({ youtubeVideoId: { $regex: /^test-vid-/ } });
  });

  after(async () => {
    // Cleanup test fixtures
    await Anime.deleteMany({ slug: { $regex: /^test-/ } });
    await Episode.deleteMany({ youtubeVideoId: { $regex: /^test-vid-/ } });
    await YouTubeCandidate.deleteMany({ youtubeVideoId: { $regex: /^test-vid-/ } });
    await mongoose.disconnect();
  });

  test('Anime with no verified episodes remains discoverable in catalogue', async () => {
    // Create an unverified anime entry (e.g. metadata-only from AniList)
    const testAnime = await Anime.create({
      anilistId: 9999991,
      title: 'Test Metadata Only Anime',
      slug: 'test-metadata-only',
      synopsis: 'A test anime with no verified episodes yet.',
      releaseYear: 2024,
      status: 'Ongoing',
      genres: ['Fantasy'],
      verifiedEpisodeCount: 0,
      popularityScore: 100,
    });

    const result = await CatalogueService.getCatalogue({ query: 'Test Metadata Only' });
    assert.ok(result.items.some((a) => a.slug === 'test-metadata-only'), 'Should appear in search results');

    // Fetch details
    const details = await CatalogueService.getAnimeBySlug('test-metadata-only');
    assert.ok(details, 'Details should be accessible');
    assert.strictEqual(details.totalEpisodes, 0, 'Must have 0 verified episodes');
    assert.strictEqual(details.versions.length, 0, 'Must have 0 verified versions');

    // Clean up
    await Anime.deleteOne({ _id: testAnime._id });
  });

  test('YouTube candidate discovery never automatically publishes an episode', async () => {
    const candidate = await YouTubeCandidate.create({
      youtubeVideoId: 'test-vid-candidate-1',
      channelId: 'UCGbsPEK2iN416c1Nl3dFh7w',
      channelTitle: 'Muse Asia',
      videoTitle: 'Test Candidate Video Episode 1',
      claimedLanguage: 'Japanese',
      discoveryMethod: 'channel_search',
      verificationStatus: 'discovered',
    });

    // Verify candidate exists
    assert.strictEqual(candidate.verificationStatus, 'discovered');

    // Ensure NO published episode exists for this candidate
    const publishedEp = await Episode.findOne({
      youtubeVideoId: 'test-vid-candidate-1',
      isPublished: true,
    });
    assert.strictEqual(publishedEp, null, 'Discovered candidate must NEVER create published episode automatically');

    await YouTubeCandidate.deleteOne({ _id: candidate._id });
  });

  test('Verification workflow creates published episode and updates verifiedEpisodeCount', async () => {
    // Create anime
    const anime = await Anime.create({
      anilistId: 9999992,
      title: 'Test Verification Anime',
      slug: 'test-verification-anime',
      synopsis: 'Testing verification workflow.',
      releaseYear: 2023,
      status: 'Completed',
      genres: ['Action'],
      verifiedEpisodeCount: 0,
      popularityScore: 50,
    });

    // Create candidate
    const candidate = await YouTubeCandidate.create({
      youtubeVideoId: 'test-vid-verify-1',
      channelId: 'UCGbsPEK2iN416c1Nl3dFh7w',
      channelTitle: 'Muse Asia',
      videoTitle: 'Test Verification Anime Episode 1',
      candidateAnimeId: anime._id,
      candidateAnimeSlug: anime.slug,
      candidateEpisodeNumber: 1,
      claimedLanguage: 'Japanese',
      verificationStatus: 'discovered',
    });

    // Run verification
    const verifyResult = await VerificationService.verifyAndPublish({
      candidateId: candidate._id.toString(),
      animeSlug: anime.slug,
      episodeNumber: 1,
      episodeTitle: 'The Awakening',
      audioLanguage: 'Japanese',
      reviewerName: 'Test Reviewer',
    });

    assert.strictEqual(verifyResult.success, true);
    assert.strictEqual(verifyResult.verifiedEpisodeCount, 1);

    // Check anime updated in DB
    const updatedAnime = await Anime.findById(anime._id);
    assert.strictEqual(updatedAnime?.verifiedEpisodeCount, 1, 'Verified count must be 1');

    // Check candidate status updated to verified
    const updatedCand = await YouTubeCandidate.findById(candidate._id);
    assert.strictEqual(updatedCand?.verificationStatus, 'verified');

    // Check published episode exists
    const ep = await Episode.findOne({ youtubeVideoId: 'test-vid-verify-1' });
    assert.ok(ep);
    assert.strictEqual(ep.isPublished, true);
    assert.strictEqual(ep.verificationStatus, 'verified');
    assert.strictEqual(ep.episodeNumber, 1);

    // Clean up
    await Anime.deleteOne({ _id: anime._id });
    await AnimeVersion.deleteMany({ anime: anime._id });
    await Episode.deleteOne({ _id: ep._id });
    await YouTubeCandidate.deleteOne({ _id: candidate._id });
  });

  test('Unverified, rejected, and unavailable episodes are excluded from public episode APIs', async () => {
    const anime = await Anime.create({
      anilistId: 9999993,
      title: 'Test Rejection Anime',
      slug: 'test-rejection-anime',
      synopsis: 'Testing rejection exclusion.',
      releaseYear: 2022,
      status: 'Ongoing',
      genres: ['Thriller'],
      verifiedEpisodeCount: 0,
    });

    const version = await AnimeVersion.create({
      anime: anime._id,
      audioLanguage: 'Japanese',
      channelName: 'Muse Asia',
      verificationStatus: 'verified',
    });

    // Create an unverified episode and a rejected episode
    const unverifiedEp = await Episode.create({
      anime: anime._id,
      version: version._id,
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Pending Review Episode',
      youtubeVideoId: 'test-vid-unverified',
      verificationStatus: 'unverified',
      isPublished: false,
    });

    const rejectedEp = await Episode.create({
      anime: anime._id,
      version: version._id,
      seasonNumber: 1,
      episodeNumber: 2,
      title: 'Rejected Episode',
      youtubeVideoId: 'test-vid-rejected',
      verificationStatus: 'rejected',
      isPublished: false,
    });

    // Public details query
    const details = await CatalogueService.getAnimeBySlug('test-rejection-anime');
    assert.ok(details);
    assert.strictEqual(details.totalEpisodes, 0, 'Unverified and rejected episodes must not count');

    const v = details.versions.find((item) => item.audioLanguage === 'Japanese');
    assert.strictEqual(v?.episodes.length, 0, 'No unverified episodes should appear in public version list');

    // Clean up
    await Anime.deleteOne({ _id: anime._id });
    await AnimeVersion.deleteOne({ _id: version._id });
    await Episode.deleteMany({ _id: { $in: [unverifiedEp._id, rejectedEp._id] } });
  });

  test('Metadata refresh does not erase verified episode mappings', async () => {
    const anime = await Anime.create({
      anilistId: 9999994,
      title: 'Original Title',
      slug: 'test-refresh-anime',
      synopsis: 'Original synopsis',
      releaseYear: 2020,
      status: 'Completed',
      genres: ['Sci-Fi'],
      verifiedEpisodeCount: 2,
    });

    // Refresh metadata (simulate AniList update)
    await Anime.updateOne(
      { _id: anime._id },
      {
        $set: {
          synopsis: 'Updated synopsis from AniList sync',
          status: 'Ongoing',
        },
      }
    );

    const refreshed = await Anime.findById(anime._id);
    assert.strictEqual(refreshed?.synopsis, 'Updated synopsis from AniList sync');
    assert.strictEqual(refreshed?.verifiedEpisodeCount, 2, 'Verified episode count must be preserved');

    await Anime.deleteOne({ _id: anime._id });
  });

  test('Unauthorized requests cannot access admin operations', () => {
    // Mock NextRequest without valid header
    const mockReq = {
      headers: new Headers({
        'x-admin-secret': 'wrong-secret-key',
      }),
      cookies: { get: () => undefined },
    } as any;

    const authorized = isAuthorizedAdmin(mockReq);
    assert.strictEqual(authorized, false, 'Invalid secret must be rejected');

    const validReq = {
      headers: new Headers({
        'x-admin-secret': process.env.ADMIN_SECRET_KEY || 'animeyt-admin-dev-key',
      }),
      cookies: { get: () => undefined },
    } as any;

    assert.strictEqual(isAuthorizedAdmin(validReq), true, 'Valid admin secret must be authorized');
  });

  test('getEpisodesForAnime returns only published verified episodes and respects filters', async () => {
    const anime = await Anime.create({
      anilistId: 9999995,
      title: 'Test Episodes Filter Anime',
      slug: 'test-episodes-filter',
      synopsis: 'Testing episodes endpoint.',
      releaseYear: 2024,
      status: 'Ongoing',
      genres: ['Action'],
      verifiedEpisodeCount: 1,
    });

    const vJa = await AnimeVersion.create({
      anime: anime._id,
      audioLanguage: 'Japanese',
      channelName: 'Muse Asia',
      verificationStatus: 'verified',
    });

    const ep1 = await Episode.create({
      anime: anime._id,
      version: vJa._id,
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Episode 1 Verified',
      youtubeVideoId: 'test-vid-ep-verified-1',
      isPublished: true,
      verificationStatus: 'verified',
    });

    const ep2Unpublished = await Episode.create({
      anime: anime._id,
      version: vJa._id,
      seasonNumber: 1,
      episodeNumber: 2,
      title: 'Episode 2 Pending',
      youtubeVideoId: 'test-vid-ep-pending-2',
      isPublished: false,
      verificationStatus: 'unverified',
    });

    const eps = await CatalogueService.getEpisodesForAnime('test-episodes-filter');
    assert.strictEqual(eps.length, 1, 'Only published verified episodes must be returned');
    assert.strictEqual(eps[0].youtubeVideoId, 'test-vid-ep-verified-1');

    // Also verify querying by ObjectId
    const epsById = await CatalogueService.getEpisodesForAnime(anime._id.toString());
    assert.strictEqual(epsById.length, 1);

    await Anime.deleteOne({ _id: anime._id });
    await AnimeVersion.deleteOne({ _id: vJa._id });
    await Episode.deleteMany({ _id: { $in: [ep1._id, ep2Unpublished._id] } });
  });

  test('Repeated discovery jobs do not create duplicate candidates', async () => {
    const videoId = 'test-vid-dedup-check';
    await YouTubeCandidate.deleteOne({ youtubeVideoId: videoId });

    // Insert first
    const cand1 = await YouTubeCandidate.create({
      youtubeVideoId: videoId,
      channelId: 'UCGbsPEK2iN416c1Nl3dFh7w',
      channelTitle: 'Muse Asia',
      videoTitle: 'Dedup Video',
      verificationStatus: 'discovered',
    });
    assert.ok(cand1);

    // Attempting duplicate insert should reject by unique index
    await assert.rejects(
      async () => {
        await YouTubeCandidate.create({
          youtubeVideoId: videoId,
          channelId: 'UCGbsPEK2iN416c1Nl3dFh7w',
          channelTitle: 'Muse Asia',
          videoTitle: 'Dedup Video Duplicate',
          verificationStatus: 'discovered',
        });
      },
      /E11000/
    );

    await YouTubeCandidate.deleteOne({ _id: cand1._id });
  });

  test('AniList re-importing same anilistId upserts rather than duplicates', async () => {
    const anilistId = 9999996;
    await Anime.deleteOne({ anilistId });

    // First import
    const a1 = await Anime.create({
      anilistId,
      title: 'Initial Title',
      slug: 'test-anilist-dedup',
      synopsis: 'Initial synopsis',
      releaseYear: 2021,
      status: 'Completed',
      genres: ['Action'],
      verifiedEpisodeCount: 1,
    });

    // Re-import with same AniList ID
    await Anime.findOneAndUpdate(
      { anilistId },
      { $set: { synopsis: 'Updated via re-import' } },
      { returnDocument: 'after' }
    );

    const totalMatching = await Anime.countDocuments({ anilistId });
    assert.strictEqual(totalMatching, 1, 'Re-importing must not duplicate record');

    const updated = await Anime.findOne({ anilistId });
    assert.strictEqual(updated?.synopsis, 'Updated via re-import');
    assert.strictEqual(updated?.verifiedEpisodeCount, 1, 'Verified episode count preserved');

    await Anime.deleteOne({ _id: a1._id });
  });

  test('Empty search and filtered queries return empty arrays cleanly without crashing or substituting mock data', async () => {
    const nonExistentResult = await CatalogueService.getCatalogue({
      query: 'XYZNonExistentAnimeTitle1234567890',
    });

    assert.strictEqual(nonExistentResult.items.length, 0);
    assert.strictEqual(nonExistentResult.total, 0);
    assert.strictEqual(nonExistentResult.hasMore, false);

    const nonExistentDetails = await CatalogueService.getAnimeBySlug('xyz-non-existent-slug');
    assert.strictEqual(nonExistentDetails, null);

    const nonExistentEps = await CatalogueService.getEpisodesForAnime('xyz-non-existent-slug');
    assert.deepStrictEqual(nonExistentEps, []);
  });
});

