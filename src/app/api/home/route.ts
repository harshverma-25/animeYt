import { NextResponse } from 'next/server';
import { CatalogueService } from '@/lib/services/catalogueService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await CatalogueService.getHomePageData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    console.error('API /api/home error:', err);
    return NextResponse.json({ featured: [], popular: [], recentlyAdded: [] }, { status: 500 });
  }
}
