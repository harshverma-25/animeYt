import { NextRequest, NextResponse } from 'next/server';
import { CatalogueService } from '@/lib/services/catalogueService';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug?: string; id?: string }> }
) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug || resolvedParams.id;
    if (!slug) {
      return NextResponse.json({ error: 'Slug or ID is required' }, { status: 400 });
    }

    const anime = await CatalogueService.getAnimeBySlug(slug);
    if (!anime) {
      return NextResponse.json({ error: 'Anime not found' }, { status: 404 });
    }

    return NextResponse.json(anime, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    console.error('API /api/catalogue/[slug] error:', err);
    return NextResponse.json({ error: 'Failed to fetch anime details' }, { status: 500 });
  }
}
