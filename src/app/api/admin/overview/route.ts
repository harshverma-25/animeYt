import { NextRequest, NextResponse } from 'next/server';
import { CatalogueService } from '@/lib/services/catalogueService';
import { isAuthorizedAdmin, unauthorizedResponse } from '@/lib/auth/adminAuth';
import { YouTubeService } from '@/lib/services/youtubeService';

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    const data = await CatalogueService.getAdminOverview();
    return NextResponse.json({
      success: true,
      data,
      youtubeConfigured: YouTubeService.isConfigured(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
