import { CatalogueService } from '@/lib/services/catalogueService';
import HomePageClient from '@/components/Home/HomePageClient';

export default async function HomePage() {
  const [featured, popular, recentlyAdded, availableAudio] = await Promise.all([
    CatalogueService.getFeaturedAnime(),
    CatalogueService.getPopularAnime(12),
    CatalogueService.getRecentlyAddedAnime(12),
    CatalogueService.getAudioLanguages(),
  ]);

  return (
    <HomePageClient
      initialFeatured={featured}
      initialPopular={popular}
      initialRecentlyAdded={recentlyAdded}
      availableAudio={availableAudio}
    />
  );
}
