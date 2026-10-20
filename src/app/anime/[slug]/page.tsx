import { notFound } from 'next/navigation';
import { CatalogueService } from '@/lib/services/catalogueService';
import AnimeDetailsClient from '@/components/Details/AnimeDetailsClient';

export const dynamic = 'force-dynamic';

interface AnimeDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AnimeDetailsPage({ params }: AnimeDetailsPageProps) {
  const { slug } = await params;
  const anime = await CatalogueService.getAnimeBySlug(slug);

  if (!anime) {
    notFound();
  }

  return <AnimeDetailsClient anime={anime} />;
}
