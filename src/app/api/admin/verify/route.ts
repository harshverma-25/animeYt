import { NextRequest, NextResponse } from 'next/server';
import { CatalogueService } from '@/lib/services/catalogueService';
import { isAuthorizedAdmin, unauthorizedResponse } from '@/lib/auth/adminAuth';

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();
    const { type, id, status } = body;

    if (!type || !id || !status) {
      return NextResponse.json(
        { error: 'Fields type ("episode" | "version"), id, and status are required' },
        { status: 400 }
      );
    }

    if (!['verified', 'unverified', 'unavailable'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be verified, unverified, or unavailable' },
        { status: 400 }
      );
    }

    const success = await CatalogueService.updateVerificationStatus(type, id, status);
    return NextResponse.json({ success, id, status, type });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
