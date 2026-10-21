'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function WatchSlugRedirect() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/catalogue/${slug}`)
      .then((res) => res.json())
      .then((anime) => {
        const firstEp = anime?.versions?.[0]?.episodes?.[0];
        if (firstEp) {
          router.replace(`/watch/${slug}/${firstEp.id || firstEp.youtubeVideoId}`);
        } else {
          router.replace(`/anime/${slug}`);
        }
      })
      .catch(() => {
        router.replace(`/anime/${slug}`);
      });
  }, [slug, router]);

  return (
    <div className="glass rounded-[36px] p-12 text-center text-white/70">
      Loading episode...
    </div>
  );
}
