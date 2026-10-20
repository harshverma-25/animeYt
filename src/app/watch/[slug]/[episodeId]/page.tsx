import { notFound } from 'next/navigation';
import { CatalogueService } from '@/lib/services/catalogueService';
import WatchPageClient from '@/components/Watch/WatchPageClient';

export const dynamic = 'force-dynamic';

interface WatchEpisodePageProps {
  params: Promise<{ slug: string; episodeId: string }>;
}

export default async function WatchEpisodePage({ params }: WatchEpisodePageProps) {
  const { slug, episodeId } = await params;
  const anime = await CatalogueService.getAnimeBySlug(slug);

  if (!anime) {
    notFound();
  }

  // Find the requested episode across all versions
  let currentEpisode = null;
  let currentVersion = null;

  for (const v of anime.versions) {
    const ep = v.episodes.find((e) => (e.id || e._id) === episodeId);
    if (ep) {
      currentEpisode = ep;
      currentVersion = v;
      break;
    }
  }

  // If specific episode ID wasn't found directly, default to first available
  if (!currentEpisode && anime.versions.length > 0) {
    currentVersion = anime.versions[0];
    currentEpisode = currentVersion.episodes[0] || null;
  }

  if (!currentEpisode || !currentVersion) {
    notFound();
  }

  return (
    <WatchPageClient
      anime={anime}
      initialEpisode={currentEpisode}
      initialVersion={currentVersion}
    />
  );
}
