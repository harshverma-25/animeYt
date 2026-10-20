import { NextRequest, NextResponse } from 'next/server';
import { CatalogueService } from '@/lib/services/catalogueService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    const anime = await CatalogueService.getAnimeBySlug(slug);
    if (!anime) {
      return NextResponse.json({ error: 'Anime not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: anime,
    });
  } catch (error) {
    console.error('API /api/catalogue/[slug] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch anime details', message: (error as Error).message },
      { status: 500 }
    );
  }
}
