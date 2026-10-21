import { redirect } from 'next/navigation';
import { CatalogueService } from '@/lib/services/catalogueService';

export default async function WatchSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) {
    redirect('/');
  }

  const anime = await CatalogueService.getAnimeBySlug(slug);
  const firstEp = anime?.versions?.[0]?.episodes?.[0];

  if (firstEp) {
    redirect(`/watch/${slug}/${firstEp.id || firstEp.youtubeVideoId}`);
  }

  redirect(`/anime/${slug}`);
}
