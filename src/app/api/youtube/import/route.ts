import { NextRequest, NextResponse } from 'next/server';
import { YouTubeDiscoveryService } from '@/lib/services/youtubeDiscoveryService';
import { isAuthorizedAdmin, unauthorizedResponse } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { type, targetId, maxResults = 20, animeSlug, query } = body;

    if (!type || !targetId) {
      return NextResponse.json(
        { error: 'type ("playlist" | "channel") and targetId are required' },
        { status: 400 }
      );
    }

    const result = await YouTubeDiscoveryService.discoverCandidates({
      playlistId: type === 'playlist' ? targetId : undefined,
      channelId: type === 'channel' ? targetId : undefined,
      searchQuery: query,
      targetAnimeSlug: animeSlug,
      maxResults,
    });

    if (result.status === 'failed') {
      return NextResponse.json(
        {
          success: false,
          error: result.errorSummary || 'YouTube discovery failed',
          jobId: result.jobId,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Discovered ${result.newCandidatesCount} new candidate videos awaiting admin review. Candidates are never auto-published.`,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
