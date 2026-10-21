import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, unauthorizedResponse } from '@/lib/auth/adminAuth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ImportJob } from '@/lib/db/models/ImportJob';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    await connectToDatabase();
    const jobs = await ImportJob.find().sort({ createdAt: -1 }).limit(25).lean();
    return NextResponse.json({ jobs });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
