import { redirect, notFound } from 'next/navigation';
import { CatalogueService } from '@/lib/services/catalogueService';

export const dynamic = 'force-dynamic';

interface WatchSlugPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WatchSlugPage({ params }: WatchSlugPageProps) {
  const { slug } = await params;
  const anime = await CatalogueService.getAnimeBySlug(slug);

  if (!anime) {
    notFound();
  }

  // Find first verified episode
  for (const version of anime.versions) {
    if (version.verificationStatus === 'verified' && version.episodes.length > 0) {
      const firstEp = version.episodes[0];
      const epId = firstEp.id || firstEp._id;
      redirect(`/watch/${anime.slug}/${epId}`);
    }
  }

  // If no episodes available yet, redirect back to details page
  redirect(`/anime/${anime.slug}`);
}
