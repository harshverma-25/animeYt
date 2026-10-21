import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, unauthorizedResponse } from '@/lib/auth/adminAuth';
import { EpisodeManagementService } from '@/lib/services/episodeManagementService';
import { extractPlaylistId } from '@/lib/utils/youtubeUtils';
import { YouTubeService } from '@/lib/services/youtubeService';

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();
    const animeSlugOrId = body.animeSlugOrId || body.animeSlug || body.animeId;
    const audioLanguage = body.audioLanguage || 'Japanese';
    const seasonNumber = body.seasonNumber ? parseInt(body.seasonNumber, 10) : 1;
    const autoVerify = body.autoVerify !== false;

    if (!animeSlugOrId) {
      return NextResponse.json(
        { error: 'animeSlugOrId is required' },
        { status: 400 }
      );
    }

    let videoInputs: string[] = [];

    // If explicit video inputs were provided
    if (body.videoInputs) {
      if (Array.isArray(body.videoInputs)) {
        videoInputs = body.videoInputs;
      } else if (typeof body.videoInputs === 'string') {
        videoInputs = body.videoInputs.split(/[\r\n,]+/).map((s: string) => s.trim()).filter(Boolean);
      }
    }

    let playlistId = body.playlistId;

    // If playlist URL or ID provided
    if (body.playlistUrl) {
      playlistId = extractPlaylistId(body.playlistUrl) || body.playlistUrl.trim();
    }

    // If playlist provided but no direct video URLs provided:
    if (videoInputs.length === 0 && playlistId) {
      if (YouTubeService.hasDataApiKey()) {
        const fetchRes = await YouTubeService.fetchPlaylistVideos(playlistId, 50, true);
        if (fetchRes.videos && fetchRes.videos.length > 0) {
          videoInputs = fetchRes.videos.map((v) => v.videoId);
        } else if (fetchRes.error) {
          return NextResponse.json(
            {
              error: `Could not fetch playlist: ${fetchRes.error}. Please paste the list of video URLs or IDs directly into the manual import box.`,
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          {
            error:
              'YouTube Data API is not configured or disabled. In compliance with YouTube terms against unpermitted scraping, please paste the video URLs or IDs directly into the video list input below.',
            requiresManualList: true,
            playlistId,
          },
          { status: 400 }
        );
      }
    }

    if (videoInputs.length === 0) {
      return NextResponse.json(
        {
          error:
            'No video URLs or IDs provided. Paste one or more YouTube video URLs or IDs (one per line) to import.',
        },
        { status: 400 }
      );
    }

    const report = await EpisodeManagementService.batchImportVideos({
      animeSlugOrId,
      audioLanguage,
      seasonNumber,
      videoInputs,
      autoVerify,
      playlistId,
      reviewerName: body.reviewerName || 'admin',
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
