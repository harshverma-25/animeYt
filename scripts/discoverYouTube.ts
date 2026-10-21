import { YouTubeDiscoveryService } from '../src/lib/services/youtubeDiscoveryService';
import { connectToDatabase } from '../src/lib/db/mongodb';
import mongoose from 'mongoose';

async function run() {
  console.log('Connecting to database...');
  await connectToDatabase();

  const query = process.env.DISCOVER_QUERY || 'Demon Slayer Episode 1';
  const slug = process.env.DISCOVER_SLUG || 'demon-slayer';

  console.log(`Starting YouTube Discovery (query: "${query}", slug: "${slug}")...`);
  const result = await YouTubeDiscoveryService.discoverCandidates({
    searchQuery: query,
    targetAnimeSlug: slug,
    maxResults: 20,
  });

  console.log('YouTube Discovery Finished:');
  console.log(result);

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error('Fatal error during YouTube discovery:', e);
  process.exit(1);
});
