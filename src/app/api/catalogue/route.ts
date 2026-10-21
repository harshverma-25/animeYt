import { NextRequest, NextResponse } from 'next/server';
import { CatalogueService } from '@/lib/services/catalogueService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('query') || undefined;
    const genre = searchParams.get('genre') || undefined;
    const audioLanguage = searchParams.get('lang') || searchParams.get('audioLanguage') || undefined;
    const sortBy = (searchParams.get('sort') || searchParams.get('sortBy') || 'popular') as any;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const idsParam = searchParams.get('ids');
    const ids = idsParam ? idsParam.split(',').map((s) => s.trim()).filter(Boolean) : undefined;

    const result = await CatalogueService.getCatalogue({
      query,
      genre,
      audioLanguage,
      sortBy,
      page,
      limit,
      verifiedOnly,
      ids,
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    console.error('API /api/catalogue error:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve anime catalogue', items: [], total: 0 },
      { status: 500 }
    );
  }
}
