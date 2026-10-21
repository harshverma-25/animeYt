import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/auth/adminAuth';
import { AutoEpisodeDetectionService } from '@/lib/services/autoEpisodeDetectionService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Up to 60s for scan execution

export async function GET(req: NextRequest) {
  return handleManualScan(req);
}

export async function POST(req: NextRequest) {
  return handleManualScan(req);
}

async function handleManualScan(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // Strict authorization: requires valid admin secret or CRON_SECRET token.
  // Note: Automated Vercel Cron scheduling is removed from vercel.json. Insecure User-Agent checks and unauthenticated dev bypasses are removed.
  const isAuthorized =
    isAuthorizedAdmin(req) ||
    Boolean(cronSecret && token && token === cronSecret);

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid administrator or execution credentials required.' },
      { status: 401 }
    );
  }

  try {
    const result = await AutoEpisodeDetectionService.runFullScan();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error('Manual episode detection scan failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error during episode detection scan',
      },
      { status: 500 }
    );
  }
}
