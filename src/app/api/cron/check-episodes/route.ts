import { NextRequest, NextResponse } from 'next/server';
import { AutoEpisodeDetectionService } from '@/lib/services/autoEpisodeDetectionService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Up to 60s for serverless crons

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const adminSecret = process.env.ADMIN_SECRET_KEY || 'animeyt-admin-dev-key';
  const isVercelCron = req.headers.get('user-agent')?.includes('vercel-cron');

  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  const isAuthorized =
    (cronSecret && token === cronSecret) ||
    (adminSecret && token === adminSecret) ||
    isVercelCron ||
    (process.env.NODE_ENV === 'development' && !cronSecret);

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid cron authentication token' },
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
    console.error('Automatic episode detection cron failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error during episode detection scan',
      },
      { status: 500 }
    );
  }
}
