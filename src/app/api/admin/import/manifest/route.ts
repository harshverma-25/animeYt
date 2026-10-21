import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, unauthorizedResponse } from '@/lib/auth/adminAuth';
import { ManifestImportService } from '@/lib/services/manifestImportService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batchSize || 10;
    const startIndex = body.startIndex || 0;
    const filterLanguage = body.filterLanguage || undefined;
    const filterPublisher = body.filterPublisher || undefined;
    const autoVerifyEligible = !!body.autoVerifyEligible;
    const maxVideosPerAnime = body.maxVideosPerAnime || 3;
    const stage = body.stage || 'all';

    const report = await ManifestImportService.importManifest({
      batchSize,
      startIndex,
      filterLanguage,
      filterPublisher,
      autoVerifyEligible,
      maxVideosPerAnime,
      stage,
    });

    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
