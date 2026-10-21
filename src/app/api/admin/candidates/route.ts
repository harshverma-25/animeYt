import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, unauthorizedResponse } from '@/lib/auth/adminAuth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { YouTubeCandidate } from '@/lib/db/models/YouTubeCandidate';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: Record<string, any> = {};
    if (status && status !== 'all') {
      query.verificationStatus = status;
    }

    const candidates = await YouTubeCandidate.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ candidates, count: candidates.length });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
