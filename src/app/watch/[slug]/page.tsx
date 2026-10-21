'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAnimeBySlug } from '@/data/anime';

export default function WatchSlugRedirect() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  useEffect(() => {
    const anime = getAnimeBySlug(slug);
    if (anime && anime.versions?.[0]?.episodes?.[0]) {
      router.replace(`/watch/${slug}/${anime.versions[0].episodes[0].id}`);
    } else {
      router.replace(`/anime/${slug}`);
    }
  }, [slug, router]);

  return (
    <div className="glass rounded-[36px] p-12 text-center text-white/70">
      Loading episode...
    </div>
  );
}
