import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, unauthorizedResponse } from '@/lib/auth/adminAuth';
import { VerificationService } from '@/lib/services/verificationService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json().catch(() => ({}));
    const result = await VerificationService.runAvailabilityCheck(body.limit || 20);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
