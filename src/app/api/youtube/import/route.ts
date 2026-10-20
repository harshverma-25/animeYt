import { NextRequest, NextResponse } from 'next/server';
import { YouTubeService } from '@/lib/services/youtubeService';
import { CatalogueService } from '@/lib/services/catalogueService';
import { isAuthorizedAdmin, unauthorizedResponse } from '@/lib/auth/adminAuth';

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();
    const { type, targetId, animeId, versionId, maxResults = 15 } = body;

    if (!type || !targetId) {
      return NextResponse.json(
        { error: 'type ("playlist" | "channel") and targetId are required' },
        { status: 400 }
      );
    }

    let fetchResult;
    if (type === 'playlist') {
      fetchResult = await YouTubeService.fetchPlaylistVideos(targetId, maxResults);
    } else {
      const query = body.query || 'Anime Episode';
      fetchResult = await YouTubeService.searchChannelVideos(targetId, query, maxResults);
    }

    if (fetchResult.error && !fetchResult.videos.length) {
      return NextResponse.json(
        {
          success: false,
          error: fetchResult.error,
          isSimulated: fetchResult.isSimulated,
        },
        { status: 400 }
      );
    }

    const importedEpisodes = [];
    if (animeId && versionId) {
      for (const v of fetchResult.videos) {
        const epNum = YouTubeService.parseEpisodeNumber(v.title);
        const added = await CatalogueService.addEpisode({
          animeId,
          versionId,
          seasonNumber: 1,
          episodeNumber: epNum,
          title: v.title,
          youtubeVideoId: v.videoId,
          playlistId: v.playlistId,
          verificationStatus: 'unverified', // verification workflow: unverified by default!
          duration: '24:00',
          thumbnail: v.thumbnailUrl,
        });
        importedEpisodes.push(added);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Retrieved ${fetchResult.videos.length} videos from YouTube. ${
        importedEpisodes.length > 0
          ? `Imported ${importedEpisodes.length} as unverified episodes awaiting admin review.`
          : 'Ready for assignment.'
      }`,
      videos: fetchResult.videos,
      importedEpisodes,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
