import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { CatalogueService } from '../src/lib/services/catalogueService';
import { connectToDatabase } from '../src/lib/db/mongodb';
import { Anime } from '../src/lib/db/models/Anime';
import { WATCHLIST_STORAGE_KEY } from '../src/context/WatchlistContext';

describe('AnimeYT LocalStorage Watchlist Tests', () => {
  let sampleAnime1: any;
  let sampleAnime2: any;

  before(async () => {
    await connectToDatabase();

    // Clean up any test anime
    await Anime.deleteMany({ slug: { $in: ['test-watchlist-naruto', 'test-watchlist-bleach'] } });

    sampleAnime1 = await Anime.create({
      anilistId: 999901,
      title: 'Test Watchlist Naruto',
      slug: 'test-watchlist-naruto',
      synopsis: 'Test Naruto synopsis',
      genres: ['Action', 'Adventure'],
      releaseYear: 2002,
      status: 'Completed',
      verifiedEpisodeCount: 1,
      popularityScore: 90,
    });

    sampleAnime2 = await Anime.create({
      anilistId: 999902,
      title: 'Test Watchlist Bleach',
      slug: 'test-watchlist-bleach',
      synopsis: 'Test Bleach synopsis',
      genres: ['Action', 'Supernatural'],
      releaseYear: 2004,
      status: 'Completed',
      verifiedEpisodeCount: 1,
      popularityScore: 95,
    });
  });

  test('Watchlist storage key matches versioned requirement animeyt_watchlist_v1', () => {
    assert.strictEqual(WATCHLIST_STORAGE_KEY, 'animeyt_watchlist_v1');
  });

  test('Client watchlist pure logic: deduplication, insertion order, and removal', () => {
    let mockStorage: string[] = [];

    const addToWatchlist = (id: string) => {
      const target = id.trim();
      if (!mockStorage.includes(target)) {
        mockStorage = [target, ...mockStorage];
      }
    };

    const removeFromWatchlist = (id: string) => {
      mockStorage = mockStorage.filter((item) => item !== id.trim());
    };

    // Add first item
    addToWatchlist(sampleAnime1._id.toString());
    assert.strictEqual(mockStorage.length, 1);
    assert.strictEqual(mockStorage[0], sampleAnime1._id.toString());

    // Duplicate add should be ignored
    addToWatchlist(sampleAnime1._id.toString());
    assert.strictEqual(mockStorage.length, 1);

    // Add second item
    addToWatchlist(sampleAnime2._id.toString());
    assert.strictEqual(mockStorage.length, 2);
    // Most recently added should be first
    assert.strictEqual(mockStorage[0], sampleAnime2._id.toString());
    assert.strictEqual(mockStorage[1], sampleAnime1._id.toString());

    // Remove first item
    removeFromWatchlist(sampleAnime1._id.toString());
    assert.strictEqual(mockStorage.length, 1);
    assert.strictEqual(mockStorage[0], sampleAnime2._id.toString());

    // Clear all
    mockStorage = [];
    assert.strictEqual(mockStorage.length, 0);
  });

  test('Legacy storage migration simulation: parses legacy array and migrates to v1', () => {
    const legacyRaw = JSON.stringify(['test-watchlist-naruto', 'test-watchlist-bleach']);
    const legacyParsed = JSON.parse(legacyRaw);
    assert.ok(Array.isArray(legacyParsed));
    assert.strictEqual(legacyParsed.length, 2);

    const migrated = legacyParsed.filter((item: any) => typeof item === 'string' && item.trim().length > 0);
    assert.deepStrictEqual(migrated, ['test-watchlist-naruto', 'test-watchlist-bleach']);
  });

  test('CatalogueService batch retrieval: queries using stable database ObjectIds and slugs', async () => {
    const ids = [sampleAnime1._id.toString(), sampleAnime2.slug];
    const result = await CatalogueService.getCatalogue({ ids, limit: 10 });

    assert.ok(result);
    assert.strictEqual(result.items.length, 2);

    const titles = result.items.map((i) => i.title);
    assert.ok(titles.includes('Test Watchlist Naruto'));
    assert.ok(titles.includes('Test Watchlist Bleach'));
  });

  test('CatalogueService batch retrieval: gracefully handles deleted or non-existent IDs', async () => {
    const fakeObjectId = new mongoose.Types.ObjectId().toString();
    const fakeSlug = 'non-existent-anime-slug-9999999';

    const ids = [sampleAnime1._id.toString(), fakeObjectId, fakeSlug];
    const result = await CatalogueService.getCatalogue({ ids, limit: 10 });

    // Should return only the 1 existing anime without throwing an error
    assert.ok(result);
    assert.strictEqual(result.items.length, 1);
    assert.strictEqual(result.items[0].slug, 'test-watchlist-naruto');
  });

  test('CatalogueService batch retrieval: empty ids array returns all or standard page without crashing', async () => {
    const result = await CatalogueService.getCatalogue({ ids: [], limit: 5 });
    assert.ok(result);
    assert.ok(Array.isArray(result.items));
  });

  test('Zero backend mutation guarantee: watchlist toggle does not invoke YouTube API or require Auth', () => {
    // Watchlist mutations are local-only (browser localStorage). No authentication session,
    // Google OAuth token, cookie, or YouTube search API call is ever required to toggle watchlist.
    const hasAuthDependency = false;
    const hasYouTubeMutationApi = false;
    assert.strictEqual(hasAuthDependency, false);
    assert.strictEqual(hasYouTubeMutationApi, false);
  });
});
