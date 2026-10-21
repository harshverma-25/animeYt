import { connectToDatabase } from '../src/lib/db/mongodb';
import { Anime } from '../src/lib/db/models/Anime';
import { AnimeVersion } from '../src/lib/db/models/AnimeVersion';
import { Episode } from '../src/lib/db/models/Episode';
import { YouTubeCandidate } from '../src/lib/db/models/YouTubeCandidate';
import { CatalogueService } from '../src/lib/services/catalogueService';
import mongoose from 'mongoose';

async function removeJapanese() {
  console.log('Connecting to database...');
  await connectToDatabase();

  console.log('\n=== Removing Japanese Audio, Versions, Episodes & Exclusively Japanese Anime ===');

  // 1. Identify all Japanese versions
  const jaVersions = await AnimeVersion.find({
    $or: [
      { audioLanguage: { $regex: /^japanese$/i } },
      { languageCode: 'ja' },
    ],
  }).lean();

  const jaVersionIds = jaVersions.map((v) => v._id);
  console.log(`Found ${jaVersions.length} Japanese AnimeVersion records.`);

  // 2. Delete all episodes belonging to Japanese versions
  const epDeleteResult = await Episode.deleteMany({
    $or: [
      { version: { $in: jaVersionIds } },
      { languageCode: 'ja', sourceChannelName: { $regex: /muse asia|ani-one asia|gundam/i } },
    ],
  });
  console.log(`Deleted ${epDeleteResult.deletedCount} Japanese episodes.`);

  // 3. Delete the Japanese AnimeVersion documents
  const versionDeleteResult = await AnimeVersion.deleteMany({
    _id: { $in: jaVersionIds },
  });
  console.log(`Deleted ${versionDeleteResult.deletedCount} Japanese version records.`);

  // 4. Delete Japanese YouTube candidates
  const candDeleteResult = await YouTubeCandidate.deleteMany({
    claimedLanguage: { $regex: /^japanese$/i },
  });
  console.log(`Deleted ${candDeleteResult.deletedCount} Japanese candidate records.`);

  // 5. Audit all Anime documents
  const allAnime = await Anime.find({});
  let deletedAnimeCount = 0;
  let updatedAnimeCount = 0;

  for (const a of allAnime) {
    const remainingVersions = await AnimeVersion.find({ anime: a._id });
    const remainingEpisodesCount = await Episode.countDocuments({
      anime: a._id,
      isPublished: true,
      verificationStatus: 'verified',
    });

    if (remainingVersions.length === 0 || remainingEpisodesCount === 0) {
      // Exclusively Japanese anime with no remaining Hindi or English content -> Remove
      await Anime.deleteOne({ _id: a._id });
      console.log(`  ✖ Removed anime "${a.title}" (${a.slug}) - 0 Hindi/English episodes remaining.`);
      deletedAnimeCount++;
    } else {
      // Anime has remaining Hindi or English versions -> Update count
      if (a.verifiedEpisodeCount !== remainingEpisodesCount) {
        a.verifiedEpisodeCount = remainingEpisodesCount;
        await a.save();
      }
      console.log(`  ✓ Kept anime "${a.title}" (${a.slug}) with ${remainingEpisodesCount} Hindi/English episodes.`);
      updatedAnimeCount++;
    }
  }

  // 6. Clear in-memory caches
  CatalogueService.clearCache();

  console.log('\n=============================================');
  console.log('       JAPANESE CLEANUP COMPLETE REPORT      ');
  console.log('=============================================');
  console.log(`Deleted Japanese Episodes: ${epDeleteResult.deletedCount}`);
  console.log(`Deleted Japanese Versions: ${versionDeleteResult.deletedCount}`);
  console.log(`Deleted Exclusively Japanese Anime: ${deletedAnimeCount}`);
  console.log(`Kept Active Hindi / English Anime: ${updatedAnimeCount}`);
  console.log(`Total Anime in Catalogue Now: ${await Anime.countDocuments()}`);
  console.log(`Total Anime with Playable Episodes: ${await Anime.countDocuments({ verifiedEpisodeCount: { $gt: 0 } })}`);
  console.log(`Total Active Episodes in DB: ${await Episode.countDocuments({ isPublished: true, verificationStatus: 'verified' })}`);

  const remainingVersions = await AnimeVersion.aggregate([
    { $group: { _id: '$audioLanguage', count: { $sum: 1 } } },
  ]);
  console.log('\nRemaining Versions by Language:', remainingVersions);

  await mongoose.disconnect();
}

removeJapanese().catch((err) => {
  console.error('Fatal error during Japanese cleanup:', err);
  process.exit(1);
});
