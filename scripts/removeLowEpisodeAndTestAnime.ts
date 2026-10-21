import { connectToDatabase } from '../src/lib/db/mongodb';
import { Anime } from '../src/lib/db/models/Anime';
import { AnimeVersion } from '../src/lib/db/models/AnimeVersion';
import { Episode } from '../src/lib/db/models/Episode';
import { YouTubeCandidate } from '../src/lib/db/models/YouTubeCandidate';
import { CatalogueService } from '../src/lib/services/catalogueService';

async function removeLowEpisodeAndTestAnime() {
  await connectToDatabase();
  console.log('--- Scanning for Test Anime and English Anime with <= 2 episodes ---');

  // 1. Find all Test Anime
  const testAnime = await Anime.find({
    $or: [
      { slug: { $regex: 'test', $options: 'i' } },
      { title: { $regex: 'test', $options: 'i' } },
    ],
  });

  console.log(`Found ${testAnime.length} test anime to remove:`, testAnime.map((a) => a.title));

  const removedAnimeDetails: Array<{ id: string; title: string; slug: string; reason: string; episodesRemoved: number }> = [];

  for (const anime of testAnime) {
    const versions = await AnimeVersion.find({ anime: anime._id });
    const versionIds = versions.map((v) => v._id);
    const deletedEps = await Episode.deleteMany({
      $or: [{ anime: anime._id }, { version: { $in: versionIds } }],
    });
    await AnimeVersion.deleteMany({ anime: anime._id });
    await YouTubeCandidate.deleteMany({
      $or: [{ candidateAnimeId: anime._id }, { candidateAnimeSlug: anime.slug }],
    });
    await Anime.deleteOne({ _id: anime._id });

    removedAnimeDetails.push({
      id: anime._id.toString(),
      title: anime.title,
      slug: anime.slug,
      reason: 'Test anime fixture',
      episodesRemoved: deletedEps.deletedCount,
    });
  }

  // 2. Find English anime with only 1 or 2 episodes
  const allRemainingAnime = await Anime.find();
  for (const anime of allRemainingAnime) {
    const englishVersion = await AnimeVersion.findOne({
      anime: anime._id,
      audioLanguage: 'English',
    });

    if (englishVersion) {
      const epCount = await Episode.countDocuments({
        version: englishVersion._id,
        isPublished: true,
      });

      if (epCount >= 1 && epCount <= 2) {
        // Check if there are other languages (e.g. Hindi)
        const otherVersions = await AnimeVersion.find({
          anime: anime._id,
          audioLanguage: { $ne: 'English' },
        });

        if (otherVersions.length === 0) {
          // English-only anime with <= 2 episodes: remove the entire anime
          const deletedEps = await Episode.deleteMany({ anime: anime._id });
          await AnimeVersion.deleteMany({ anime: anime._id });
          await YouTubeCandidate.deleteMany({
            $or: [{ candidateAnimeId: anime._id }, { candidateAnimeSlug: anime.slug }],
          });
          await Anime.deleteOne({ _id: anime._id });

          removedAnimeDetails.push({
            id: anime._id.toString(),
            title: anime.title,
            slug: anime.slug,
            reason: `English anime with only ${epCount} episode(s)`,
            episodesRemoved: deletedEps.deletedCount,
          });
        } else {
          // Has other versions (e.g. Hindi): remove only the English version & its episodes
          const deletedEps = await Episode.deleteMany({ version: englishVersion._id });
          await AnimeVersion.deleteOne({ _id: englishVersion._id });

          // Recalculate anime verifiedEpisodeCount
          const remainingCount = await Episode.countDocuments({
            anime: anime._id,
            isPublished: true,
            verificationStatus: 'verified',
          });
          anime.verifiedEpisodeCount = remainingCount;
          await anime.save();

          console.log(
            `Removed English version (${epCount} eps) from multi-lingual anime: "${anime.title}" (Remaining eps: ${remainingCount})`
          );
        }
      }
    }
  }

  // 3. Remove any orphan test episodes or candidates
  const orphanTestEps = await Episode.deleteMany({
    $or: [
      { youtubeVideoId: { $regex: 'TEST_', $options: 'i' } },
      { sourceChannelId: 'UC_TEST_DISTRIBUTOR_001' },
      { title: { $regex: 'test', $options: 'i' } },
    ],
  });

  const orphanTestCandidates = await YouTubeCandidate.deleteMany({
    $or: [
      { youtubeVideoId: { $regex: 'TEST_', $options: 'i' } },
      { channelId: 'UC_TEST_DISTRIBUTOR_001' },
      { candidateAnimeSlug: { $regex: 'test', $options: 'i' } },
    ],
  });

  // Clear in-memory cache
  CatalogueService.clearCache();

  console.log('\n=== REMOVAL SUMMARY ===');
  console.log(`Total Anime Removed: ${removedAnimeDetails.length}`);
  console.table(removedAnimeDetails);
  console.log(`Orphan test episodes deleted: ${orphanTestEps.deletedCount}`);
  console.log(`Orphan test candidates deleted: ${orphanTestCandidates.deletedCount}`);

  // Print remaining catalogue stats
  const remainingAnimeCount = await Anime.countDocuments();
  const remainingVersionCount = await AnimeVersion.countDocuments();
  const remainingEpisodeCount = await Episode.countDocuments({ isPublished: true });

  console.log('\n=== REMAINING CATALOGUE STATS ===');
  console.log(`Active Anime in DB: ${remainingAnimeCount}`);
  console.log(`Active Versions in DB: ${remainingVersionCount}`);
  console.log(`Published Episodes in DB: ${remainingEpisodeCount}`);

  process.exit(0);
}

removeLowEpisodeAndTestAnime().catch((err) => {
  console.error('Removal failed:', err);
  process.exit(1);
});
