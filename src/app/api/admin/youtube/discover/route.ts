import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, unauthorizedResponse } from '@/lib/auth/adminAuth';
import { YouTubeDiscoveryService } from '@/lib/services/youtubeDiscoveryService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json().catch(() => ({}));
    const result = await YouTubeDiscoveryService.discoverCandidates({
      channelId: body.channelId,
      playlistId: body.playlistId,
      searchQuery: body.searchQuery,
      targetAnimeSlug: body.targetAnimeSlug,
      claimedLanguage: body.claimedLanguage,
      maxResults: body.maxResults || 20,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
