import { NextRequest, NextResponse } from 'next/server';
import { CatalogueService } from '@/lib/services/catalogueService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug?: string; id?: string }> }
) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug || resolvedParams.id;
    if (!slug) {
      return NextResponse.json({ error: 'Anime slug or ID is required' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const audioLanguage = searchParams.get('lang') || searchParams.get('audioLanguage') || undefined;
    const seasonParam = searchParams.get('season') || searchParams.get('seasonNumber');
    const seasonNumber = seasonParam ? parseInt(seasonParam, 10) : undefined;

    const episodes = await CatalogueService.getEpisodesForAnime(slug, {
      audioLanguage,
      seasonNumber,
    });

    return NextResponse.json(
      {
        episodes,
        count: episodes.length,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (err) {
    console.error('API /api/anime/[slug]/episodes error:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve published episodes', episodes: [], count: 0 },
      { status: 500 }
    );
  }
}
