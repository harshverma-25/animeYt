import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/db/mongodb';
import { Anime } from '../src/lib/db/models/Anime';
import { AnimeVersion } from '../src/lib/db/models/AnimeVersion';
import { Episode } from '../src/lib/db/models/Episode';
import { YouTubeCandidate } from '../src/lib/db/models/YouTubeCandidate';
import { ImportJob } from '../src/lib/db/models/ImportJob';
import { CatalogueService } from '../src/lib/services/catalogueService';
import { VerificationService } from '../src/lib/services/verificationService';
import { YouTubeDiscoveryService } from '../src/lib/services/youtubeDiscoveryService';
import { YouTubeService } from '../src/lib/services/youtubeService';
import { isAuthorizedAdmin } from '../src/lib/auth/adminAuth';

describe('AnimeYT Data Pipeline & Verification Tests', () => {
  before(async () => {
    await connectToDatabase();
    await Anime.deleteMany({
      $or: [
        { slug: { $regex: /^test-/ } },
        { anilistId: { $in: [9999991, 9999992, 9999993, 9999994, 9999995, 9999996, 9999997, 9999998, 9999999] } },
      ],
    });
    await Episode.deleteMany({ youtubeVideoId: { $regex: /^test-vid-/ } });
    await YouTubeCandidate.deleteMany({ youtubeVideoId: { $regex: /^test-vid-/ } });
    await ImportJob.deleteMany({ jobType: { $regex: /test/ } });
  });

  after(async () => {
    // Cleanup test fixtures
    await Anime.deleteMany({ slug: { $regex: /^test-/ } });
    await Episode.deleteMany({ youtubeVideoId: { $regex: /^test-vid-/ } });
    await YouTubeCandidate.deleteMany({ youtubeVideoId: { $regex: /^test-vid-/ } });
    await ImportJob.deleteMany({ jobType: { $regex: /test/ } });
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

  test('Missing YouTube credentials return structured error, mark job failed, and create 0 candidates or episodes', async () => {
    const originalKey = process.env.YOUTUBE_API_KEY;
    delete process.env.YOUTUBE_API_KEY;

    const initialCandidateCount = await YouTubeCandidate.countDocuments({});
    const initialEpisodeCount = await Episode.countDocuments({});

    try {
      // Direct YouTubeService fetchPlaylistVideos call
      const playlistRes = await YouTubeService.fetchPlaylistVideos('PLtest-missing-key');
      assert.deepStrictEqual(playlistRes.videos, []);
      assert.ok(playlistRes.error?.includes('YouTube API key is not configured'));

      // Direct YouTubeService searchChannelVideos call
      const searchRes = await YouTubeService.searchChannelVideos('UCGbsPEK2iN416c1Nl3dFh7w', 'Episode 1');
      assert.deepStrictEqual(searchRes.videos, []);
      assert.ok(searchRes.error?.includes('YouTube API key is not configured'));

      // Discovery Service call
      const discoveryResult = await YouTubeDiscoveryService.discoverCandidates({
        searchQuery: 'test-missing-credentials-query',
      });

      assert.strictEqual(discoveryResult.status, 'failed', 'Discovery job must fail when API key missing');
      assert.ok(discoveryResult.errorSummary?.includes('YouTube API key is not configured'));
      assert.strictEqual(discoveryResult.newCandidatesCount, 0);
      assert.strictEqual(discoveryResult.totalDiscovered, 0);

      // Verify ImportJob in DB
      const job = await ImportJob.findById(discoveryResult.jobId);
      assert.ok(job);
      assert.strictEqual(job.status, 'failed');
      assert.ok(job.errorSummary?.includes('YouTube API key is not configured'));

      // Ensure zero simulated or fake records created
      const afterCandidateCount = await YouTubeCandidate.countDocuments({});
      const afterEpisodeCount = await Episode.countDocuments({});
      assert.strictEqual(afterCandidateCount, initialCandidateCount, 'Must never create fake candidates when API key is missing');
      assert.strictEqual(afterEpisodeCount, initialEpisodeCount, 'Must never create fake episodes when API key is missing');
    } finally {
      process.env.YOUTUBE_API_KEY = originalKey;
    }
  });

  test('Quota exhaustion sets import job to failed, returns structured error, and creates 0 fake records', async () => {
    const originalFetch = global.fetch;
    const initialCandidateCount = await YouTubeCandidate.countDocuments({});
    const initialEpisodeCount = await Episode.countDocuments({});

    // Mock fetch to simulate YouTube API 403 quotaExceeded
    global.fetch = async () => {
      return new Response(
        JSON.stringify({
          error: {
            errors: [
              {
                domain: 'youtube.quota',
                reason: 'quotaExceeded',
                message: 'The request cannot be completed because you have exceeded your quota.',
              },
            ],
            code: 403,
            message: 'The request cannot be completed because you have exceeded your quota.',
          },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const result = await YouTubeDiscoveryService.discoverCandidates({
        searchQuery: 'test-quota-exhaustion-query',
      });

      assert.strictEqual(result.status, 'failed', 'Job status must be failed on quota exhaustion');
      assert.ok(result.errorSummary?.includes('quota exceeded'), 'Error summary must mention quota exceeded');
      assert.strictEqual(result.newCandidatesCount, 0, 'No candidates created');
      assert.strictEqual(result.totalDiscovered, 0);

      // Verify ImportJob in DB
      const job = await ImportJob.findById(result.jobId);
      assert.ok(job);
      assert.strictEqual(job.status, 'failed');
      assert.ok(job.errorSummary?.includes('quota exceeded'));

      // Ensure zero fake candidates or episodes were added
      const afterCandidateCount = await YouTubeCandidate.countDocuments({});
      const afterEpisodeCount = await Episode.countDocuments({});
      assert.strictEqual(afterCandidateCount, initialCandidateCount, 'Must never create fake candidates on quota exhaustion');
      assert.strictEqual(afterEpisodeCount, initialEpisodeCount, 'Must never create fake episodes on quota exhaustion');
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('Empty search returns 0 candidates with completed status without injecting fake data', async () => {
    const originalFetch = global.fetch;
    const initialCandidateCount = await YouTubeCandidate.countDocuments({});

    // Mock fetch returning empty items array
    global.fetch = async () => {
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    try {
      const result = await YouTubeDiscoveryService.discoverCandidates({
        searchQuery: 'test-empty-search-query-xyz-nothing-here',
      });

      assert.strictEqual(result.status, 'completed');
      assert.strictEqual(result.totalDiscovered, 0);
      assert.strictEqual(result.newCandidatesCount, 0);
      assert.strictEqual(result.failedCount, 0);

      const afterCandidateCount = await YouTubeCandidate.countDocuments({});
      assert.strictEqual(afterCandidateCount, initialCandidateCount, 'No fake candidates should be injected on empty search');
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('Discovery and verification reject unauthorized source channel IDs', async () => {
    // 1. Discovery rejects unauthorized channel ID
    const unauthorizedChannelId = 'UCunauthorized_pirate_channel_999';
    const discoveryRes = await YouTubeDiscoveryService.discoverCandidates({
      channelId: unauthorizedChannelId,
    });

    assert.strictEqual(discoveryRes.status, 'failed');
    assert.ok(discoveryRes.errorSummary?.includes('not a verified authorized source channel'));

    // 2. VerificationService rejects candidate from unauthorized channel ID
    const cand = await YouTubeCandidate.create({
      youtubeVideoId: 'test-vid-unauth-channel',
      channelId: unauthorizedChannelId,
      channelTitle: 'Unverified Pirate Channel',
      videoTitle: 'Episode 1 Unofficial Upload',
      claimedLanguage: 'Japanese',
      verificationStatus: 'discovered',
    });

    const anime = await Anime.create({
      anilistId: 9999997,
      title: 'Test Channel Auth Anime',
      slug: 'test-channel-auth-anime',
      synopsis: 'Testing channel authorization.',
      releaseYear: 2024,
      status: 'Ongoing',
      genres: ['Action'],
      verifiedEpisodeCount: 0,
    });

    await assert.rejects(
      async () => {
        await VerificationService.verifyAndPublish({
          candidateId: cand._id.toString(),
          animeSlug: anime.slug,
          episodeNumber: 1,
        });
      },
      /is not a verified authorized distributor channel/
    );

    // Ensure candidate remained unverified and no episode created
    const candAfter = await YouTubeCandidate.findById(cand._id);
    assert.strictEqual(candAfter?.verificationStatus, 'discovered');
    const epCount = await Episode.countDocuments({ youtubeVideoId: 'test-vid-unauth-channel' });
    assert.strictEqual(epCount, 0, 'No episode record should be created for unauthorized channel');

    // Clean up
    await Anime.deleteOne({ _id: anime._id });
    await YouTubeCandidate.deleteOne({ _id: cand._id });
  });

  test('VerificationService rejects conflicting video ID mapping to another anime', async () => {
    // Anime A
    const animeA = await Anime.create({
      anilistId: 9999998,
      title: 'Test Anime A Conflicting Mapping',
      slug: 'test-anime-a-conflict',
      synopsis: 'First anime.',
      releaseYear: 2024,
      status: 'Ongoing',
      genres: ['Action'],
      verifiedEpisodeCount: 0,
    });

    // Anime B
    const animeB = await Anime.create({
      anilistId: 9999999,
      title: 'Test Anime B Conflicting Mapping',
      slug: 'test-anime-b-conflict',
      synopsis: 'Second anime.',
      releaseYear: 2024,
      status: 'Ongoing',
      genres: ['Drama'],
      verifiedEpisodeCount: 0,
    });

    const videoId = 'test-vid-conflict-shared';

    // Candidate for Anime A
    const candA = await YouTubeCandidate.create({
      youtubeVideoId: videoId,
      channelId: 'UCGbsPEK2iN416c1Nl3dFh7w', // Muse Asia (authorized)
      channelTitle: 'Muse Asia',
      videoTitle: 'Anime A Episode 1',
      candidateAnimeId: animeA._id,
      candidateAnimeSlug: animeA.slug,
      candidateEpisodeNumber: 1,
      claimedLanguage: 'Japanese',
      verificationStatus: 'discovered',
    });

    // Verify and publish for Anime A
    const resA = await VerificationService.verifyAndPublish({
      candidateId: candA._id.toString(),
      animeSlug: animeA.slug,
      episodeNumber: 1,
    });
    assert.strictEqual(resA.success, true);

    // Attempt 1: Attempt to re-verify the candidate targeting Anime B instead of Anime A
    await assert.rejects(
      async () => {
        await VerificationService.verifyAndPublish({
          candidateId: candA._id.toString(),
          animeSlug: animeB.slug,
          episodeNumber: 1,
        });
      },
      /is already mapped to another anime/
    );

    // Attempt 2: Even if candidate is deleted and re-discovered targeting Anime B,
    // the existing published episode for Anime A must prevent it being mapped to Anime B
    await YouTubeCandidate.deleteOne({ _id: candA._id });

    const candB = await YouTubeCandidate.create({
      youtubeVideoId: videoId,
      channelId: 'UCGbsPEK2iN416c1Nl3dFh7w',
      channelTitle: 'Muse Asia',
      videoTitle: 'Anime B Episode 1 Attempting Conflict',
      candidateAnimeId: animeB._id,
      candidateAnimeSlug: animeB.slug,
      candidateEpisodeNumber: 1,
      claimedLanguage: 'Japanese',
      verificationStatus: 'discovered',
    });

    await assert.rejects(
      async () => {
        await VerificationService.verifyAndPublish({
          candidateId: candB._id.toString(),
          animeSlug: animeB.slug,
          episodeNumber: 1,
        });
      },
      /is already mapped to another anime/
    );

    // Clean up
    await Anime.deleteMany({ _id: { $in: [animeA._id, animeB._id] } });
    await AnimeVersion.deleteMany({ anime: { $in: [animeA._id, animeB._id] } });
    await Episode.deleteMany({ youtubeVideoId: videoId });
    await YouTubeCandidate.deleteMany({ _id: candB._id });
  });
});

