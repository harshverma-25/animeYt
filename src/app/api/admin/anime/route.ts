import { NextRequest, NextResponse } from 'next/server';
import { CatalogueService } from '@/lib/services/catalogueService';
import { isAuthorizedAdmin, unauthorizedResponse } from '@/lib/auth/adminAuth';

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ error: 'Anime title is required' }, { status: 400 });
    }

    const anime = await CatalogueService.upsertAnime(body);
    return NextResponse.json({ success: true, data: anime });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
