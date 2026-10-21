import { AniListService } from '../src/lib/services/anilistService';
import { connectToDatabase } from '../src/lib/db/mongodb';
import mongoose from 'mongoose';

async function run() {
  console.log('Connecting to database...');
  await connectToDatabase();

  const pages = parseInt(process.env.IMPORT_PAGES || '2', 10);
  const perPage = parseInt(process.env.IMPORT_PER_PAGE || '25', 10);
  const search = process.env.IMPORT_SEARCH || undefined;

  console.log(`Starting AniList Metadata Import (pages: ${pages}, perPage: ${perPage}, search: ${search || 'all'})...`);
  const result = await AniListService.importCatalogue({
    page: 1,
    perPage,
    maxPages: pages,
    search,
  });

  console.log('AniList Import Finished:');
  console.log(result);

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error('Fatal error during AniList import:', e);
  process.exit(1);
});
