import { test, describe } from 'node:test';
import assert from 'node:assert';
import { CatalogueService } from '../src/lib/services/catalogueService';
import { YouTubeService } from '../src/lib/services/youtubeService';

describe('AnimeYT Catalogue & Navigation Tests', () => {
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
