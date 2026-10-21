import { ManifestImportService } from '../src/lib/services/manifestImportService';
import { connectToDatabase } from '../src/lib/db/mongodb';
import mongoose from 'mongoose';

async function run() {
  console.log('Connecting to database...');
  await connectToDatabase();

  const args = process.argv.slice(2);
  const batchArg = args.find((a) => a.startsWith('--batch='));
  const startArg = args.find((a) => a.startsWith('--start='));
  const langArg = args.find((a) => a.startsWith('--lang='));
  const pubArg = args.find((a) => a.startsWith('--publisher='));
  const stageArg = args.find((a) => a.startsWith('--stage='));
  const verifyArg = args.includes('--verify');

  const batchSize = batchArg ? parseInt(batchArg.split('=')[1], 10) : 10;
  const startIndex = startArg ? parseInt(startArg.split('=')[1], 10) : 0;
  const filterLanguage = langArg ? (langArg.split('=')[1] as any) : undefined;
  const filterPublisher = pubArg ? pubArg.split('=')[1] : undefined;
  const stage = stageArg ? (stageArg.split('=')[1] as any) : 'all';

  console.log(`Starting Anime Manifest Import Pipeline...`);
  console.log(`- Start Index: ${startIndex}`);
  console.log(`- Batch Size: ${batchSize}`);
  console.log(`- Stage: ${stage}`);
  console.log(`- Language Filter: ${filterLanguage || 'All'}`);
  console.log(`- Publisher Filter: ${filterPublisher || 'All'}`);
  console.log(`- Auto-Verify Eligible Candidates: ${verifyArg}`);

  const report = await ManifestImportService.importManifest({
    startIndex,
    batchSize,
    filterLanguage,
    filterPublisher,
    autoVerifyEligible: verifyArg,
    maxVideosPerAnime: 3,
    stage,
  });

  console.log('\n=============================================');
  console.log('           MANIFEST IMPORT REPORT            ');
  console.log('=============================================');
  console.log(`Job ID: ${report.jobId}`);
  console.log(`Status: ${report.status}`);
  console.log(`Manifest Entries Processed: ${report.totalManifestEntriesProcessed}`);
  console.log(`Matched Canonical Anime: ${report.matchedCanonicalAnime.length}`);
  console.log(`Anime Metadata Imported: ${report.animeMetadataImportedCount}`);
  console.log(`Real Candidates Discovered: ${report.realCandidatesDiscoveredCount}`);
  console.log(`Verified Official Sources: ${report.verifiedOfficialSourcesCount}`);
  console.log(`Episodes Approved & Published: ${report.episodesApprovedAndPublishedCount}`);
  console.log(`Unmatched / Ambiguous Titles: ${report.unmatchedOrAmbiguousTitles.length}`);
  console.log(`Titles Without Verified Free Episodes: ${report.titlesWithoutVerifiedFreeEpisodes.length}`);
  console.log(`Unavailable / Restricted Videos: ${report.unavailableOrRestrictedVideos.length}`);
  console.log(`Quota / API Failures: ${report.quotaOrApiFailures.length}`);

  if (report.matchedCanonicalAnime.length > 0) {
    console.log('\nMatched Canonical Anime Sample:');
    report.matchedCanonicalAnime.slice(0, 10).forEach((a) => {
      console.log(`  ✓ [${a.rawTitle}] -> ${a.canonicalTitle} (${a.slug})`);
    });
  }

  if (report.unmatchedOrAmbiguousTitles.length > 0) {
    console.log('\nUnmatched / Ambiguous Titles for Manual Review:');
    report.unmatchedOrAmbiguousTitles.forEach((t) => {
      console.log(`  ⚠ [${t.rawTitle}] - ${t.reason}`);
    });
  }

  if (report.titlesWithoutVerifiedFreeEpisodes.length > 0) {
    console.log('\nTitles Without Currently Verified Free Episodes:');
    report.titlesWithoutVerifiedFreeEpisodes.slice(0, 10).forEach((t) => {
      console.log(`  ○ [${t.rawTitle}] (${t.slug}) - ${t.reason}`);
    });
  }

  if (report.unavailableOrRestrictedVideos.length > 0) {
    console.log('\nUnavailable / Restricted Videos:');
    report.unavailableOrRestrictedVideos.forEach((v) => {
      console.log(`  ✖ [${v.videoId}] "${v.title}" - ${v.reason}`);
    });
  }

  if (report.quotaOrApiFailures.length > 0) {
    console.log('\nQuota / API Failures:');
    report.quotaOrApiFailures.forEach((f) => {
      console.log(`  ! [${f.endpoint}] ${f.message}`);
    });
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Fatal error in importManifest script:', err);
  process.exit(1);
});
