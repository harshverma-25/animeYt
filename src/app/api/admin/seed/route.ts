import { NextRequest, NextResponse } from 'next/server';
import { CatalogueService } from '@/lib/services/catalogueService';
import { isAuthorizedAdmin, unauthorizedResponse } from '@/lib/auth/adminAuth';

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    const result = await CatalogueService.seedInitialData();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
