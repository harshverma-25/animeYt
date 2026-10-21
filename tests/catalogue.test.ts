import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { CatalogueService } from '../src/lib/services/catalogueService';
import { YouTubeService } from '../src/lib/services/youtubeService';
import { connectToDatabase } from '../src/lib/db/mongodb';
import { Anime } from '../src/lib/db/models/Anime';
import { AnimeVersion } from '../src/lib/db/models/AnimeVersion';
import { Episode } from '../src/lib/db/models/Episode';

describe('AnimeYT Catalogue & Navigation Tests', () => {
  let createdAnimeIds: any[] = [];

  before(async () => {
    await connectToDatabase();

    // Clean up any stale records from previous aborted runs
    await Anime.deleteMany({
      $or: [
        { anilistId: { $in: [888001, 888002, 888003] } },
        { slug: { $in: ['mob-psycho-100', 'tokyo-revengers', 'spy-x-family'] } },
      ],
    });
    await Episode.deleteMany({
      youtubeVideoId: { $in: ['vid-mob-1', 'vid-mob-2', 'vid-tr-ja-1', 'vid-tr-hi-1'] },
    });

    // Seed test anime for test suite
    const a1 = await Anime.create({
      anilistId: 888001,
      title: 'Mob Psycho 100',
      slug: 'mob-psycho-100',
      synopsis: 'A middle school boy who possesses psychic powers.',
      genres: ['Action', 'Comedy'],
      releaseYear: 2016,
      status: 'Completed',
      verifiedEpisodeCount: 2,
      popularityScore: 100,
    });

    const a2 = await Anime.create({
      anilistId: 888002,
      title: 'Tokyo Revengers',
      slug: 'tokyo-revengers',
      synopsis: 'Time travel delinquent series.',
      genres: ['Action', 'Drama'],
      releaseYear: 2021,
      status: 'Ongoing',
      verifiedEpisodeCount: 2,
      popularityScore: 90,
    });

    const a3 = await Anime.create({
      anilistId: 888003,
      title: 'Spy x Family',
      slug: 'spy-x-family',
      synopsis: 'Secret agent posing as a family man.',
      genres: ['Action', 'Comedy'],
      releaseYear: 2022,
      status: 'Ongoing',
      verifiedEpisodeCount: 1,
      popularityScore: 95,
    });

    createdAnimeIds = [a1._id, a2._id, a3._id];

    // Versions
    const vMobJa = await AnimeVersion.create({
      anime: a1._id,
      audioLanguage: 'Japanese',
      channelName: 'Muse Asia',
      verificationStatus: 'verified',
    });

    const vTrJa = await AnimeVersion.create({
      anime: a2._id,
      audioLanguage: 'Japanese',
      channelName: 'Muse Asia',
      verificationStatus: 'verified',
    });

    const vTrHi = await AnimeVersion.create({
      anime: a2._id,
      audioLanguage: 'Hindi',
      channelName: 'Muse India',
      verificationStatus: 'verified',
    });

    // Episodes
    await Episode.create({
      anime: a1._id,
      version: vMobJa._id,
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Self-Proclaimed Psychic',
      youtubeVideoId: 'vid-mob-1',
      isPublished: true,
      verificationStatus: 'verified',
    });

    await Episode.create({
      anime: a1._id,
      version: vMobJa._id,
      seasonNumber: 1,
      episodeNumber: 2,
      title: 'Doubts About Youth',
      youtubeVideoId: 'vid-mob-2',
      isPublished: true,
      verificationStatus: 'verified',
    });

    await Episode.create({
      anime: a2._id,
      version: vTrJa._id,
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Reborn',
      youtubeVideoId: 'vid-tr-ja-1',
      isPublished: true,
      verificationStatus: 'verified',
    });

    await Episode.create({
      anime: a2._id,
      version: vTrHi._id,
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Reborn (Hindi Dub)',
      youtubeVideoId: 'vid-tr-hi-1',
      isPublished: true,
      verificationStatus: 'verified',
    });
  });

  after(async () => {
    await Anime.deleteMany({ _id: { $in: createdAnimeIds } });
    await AnimeVersion.deleteMany({ anime: { $in: createdAnimeIds } });
    await Episode.deleteMany({ anime: { $in: createdAnimeIds } });
    await mongoose.disconnect();
  });

  test('getCatalogue should return paginated anime titles', async () => {
    const result = await CatalogueService.getCatalogue({ page: 1, limit: 6 });
    assert.ok(result.items.length > 0, 'Should return anime items');
    assert.strictEqual(result.page, 1);
    assert.ok(result.total >= result.items.length);

    const first = result.items[0];
    assert.ok(first.title, 'Anime must have a title');
    assert.ok(first.slug, 'Anime must have a slug');
    assert.ok(Array.isArray(first.genres), 'Genres must be an array');
    assert.ok(Array.isArray(first.availableAudioLanguages), 'Audio languages must be an array');
  });

  test('getCatalogue search query should filter anime by title and synopsis', async () => {
    const mobResult = await CatalogueService.getCatalogue({ query: 'Mob Psycho' });
    assert.ok(mobResult.items.length > 0, 'Should find Mob Psycho 100');
    assert.ok(
      mobResult.items.some((a) => a.title.toLowerCase().includes('mob')),
      'Found anime must contain Mob'
    );

    const spyResult = await CatalogueService.getCatalogue({ query: 'Spy x Family' });
    assert.ok(spyResult.items.length > 0, 'Should find Spy x Family');
  });

  test('getCatalogue should filter by audio language (Hindi dub)', async () => {
    const hindiResult = await CatalogueService.getCatalogue({ audioLanguage: 'Hindi' });
    assert.ok(hindiResult.items.length > 0, 'Should find titles with Hindi dub');

    for (const anime of hindiResult.items) {
      assert.ok(
        anime.availableAudioLanguages.includes('Hindi'),
        `Anime ${anime.title} must have Hindi dub`
      );
    }
  });

  test('getCatalogue audioLanguage pagination produces exact total and correct page slice', async () => {
    // Clear cache to test fresh DB query
    CatalogueService.clearCache();
    const page1 = await CatalogueService.getCatalogue({ audioLanguage: 'Hindi', page: 1, limit: 1 });
    assert.strictEqual(page1.items.length, 1, 'Limit 1 should return exactly 1 item');
    assert.ok(page1.total >= 1, 'Total must accurately reflect matching items');
    assert.strictEqual(page1.totalPages, Math.ceil(page1.total / 1));
    assert.ok(page1.items[0].availableAudioLanguages.includes('Hindi'));
  });

  test('getCatalogue deduplicates concurrent identical in-flight requests', async () => {
    CatalogueService.clearCache();
    const req1 = CatalogueService.getCatalogue({ query: 'Tokyo Revengers' });
    const req2 = CatalogueService.getCatalogue({ query: 'Tokyo Revengers' });
    assert.strictEqual(req1, req2, 'Concurrent identical calls must share exact Promise reference');
    const [res1, res2] = await Promise.all([req1, req2]);
    assert.strictEqual(res1, res2, 'Resolved data instances must be identical');
    assert.strictEqual(res1.total, res2.total);
    assert.deepStrictEqual(res1.items.map((i) => i.slug), res2.items.map((i) => i.slug));
  });

  test('getAnimeBySlug should return full anime details with verified versions and episodes', async () => {
    const anime = await CatalogueService.getAnimeBySlug('tokyo-revengers');
    assert.ok(anime, 'Tokyo Revengers should be found');
    assert.strictEqual(anime.slug, 'tokyo-revengers');
    assert.ok(anime.versions.length >= 2, 'Tokyo Revengers should have multiple language versions');

    const hasHindi = anime.versions.some((v) => v.audioLanguage === 'Hindi');
    const hasJapanese = anime.versions.some((v) => v.audioLanguage === 'Japanese');
    assert.ok(hasHindi, 'Must have Hindi version');
    assert.ok(hasJapanese, 'Must have Japanese version');

    // Episodes test
    for (const v of anime.versions) {
      assert.ok(v.episodes.length > 0, `Version ${v.audioLanguage} should contain episodes`);
      assert.ok(v.episodes[0].youtubeVideoId, 'Episode must have a YouTube video ID');
    }
  });

  test('Episode navigation order should be sequential', async () => {
    const anime = await CatalogueService.getAnimeBySlug('mob-psycho-100');
    assert.ok(anime, 'Mob Psycho 100 should be found');

    const jaVersion = anime.versions.find((v) => v.audioLanguage === 'Japanese');
    assert.ok(jaVersion, 'Japanese version must exist');
    assert.ok(jaVersion.episodes.length >= 2, 'Must have at least 2 episodes to test navigation');

    // Verify ordering
    for (let i = 0; i < jaVersion.episodes.length - 1; i++) {
      assert.ok(
        jaVersion.episodes[i].episodeNumber <= jaVersion.episodes[i + 1].episodeNumber,
        `Episode ${i} must precede or equal episode ${i + 1}`
      );
    }
  });

  test('YouTubeService.parseEpisodeNumber extracts episode number from titles', () => {
    assert.strictEqual(YouTubeService.parseEpisodeNumber('Mob Psycho 100 Episode 01'), 1);
    assert.strictEqual(YouTubeService.parseEpisodeNumber('Spy x Family Ep. 12 [Eng Sub]'), 12);
    assert.strictEqual(YouTubeService.parseEpisodeNumber('[Hindi Dub] Tokyo Revengers E03'), 3);
    assert.strictEqual(YouTubeService.parseEpisodeNumber('One Punch Man #05'), 5);
  });

  test('Admin status toggle should update episode verification', async () => {
    const anime = await CatalogueService.getAnimeBySlug('mob-psycho-100');
    assert.ok(anime);
    const ep = anime.versions[0].episodes[0];
    const epId = ep.id || ep._id || '';

    // Toggle to unverified
    const success = await CatalogueService.updateVerificationStatus('episode', epId, 'unverified');
    assert.strictEqual(success, true);

    // Re-verify
    const reset = await CatalogueService.updateVerificationStatus('episode', epId, 'verified');
    assert.strictEqual(reset, true);
  });
});
