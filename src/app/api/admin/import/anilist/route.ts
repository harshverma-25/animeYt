import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, unauthorizedResponse } from '@/lib/auth/adminAuth';
import { AniListService } from '@/lib/services/anilistService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json().catch(() => ({}));
    const page = body.page || 1;
    const perPage = body.perPage || 20;
    const maxPages = body.maxPages || 1;
    const search = body.search || undefined;
    const genre = body.genre || undefined;

    const result = await AniListService.importCatalogue({
      page,
      perPage,
      maxPages,
      search,
      genre,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
