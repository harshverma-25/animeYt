import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, unauthorizedResponse } from '@/lib/auth/adminAuth';
import { EpisodeManagementService } from '@/lib/services/episodeManagementService';

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(req.url);
    const animeSlugOrId = searchParams.get('anime') || undefined;
    const audioLanguage = searchParams.get('language') || undefined;
    const verificationStatus = searchParams.get('status') || undefined;
    const isPublishedParam = searchParams.get('published');
    const isPublished = isPublishedParam !== null ? isPublishedParam === 'true' : undefined;
    const query = searchParams.get('q') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await EpisodeManagementService.listEpisodes({
      animeSlugOrId,
      audioLanguage,
      verificationStatus,
      isPublished,
      query,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();

    if (!body.animeSlugOrId && !body.animeSlug && !body.animeId) {
      return NextResponse.json(
        { error: 'animeSlugOrId is required' },
        { status: 400 }
      );
    }

    if (!body.youtubeUrlOrId && !body.youtubeVideoId) {
      return NextResponse.json(
        { error: 'youtubeUrlOrId is required' },
        { status: 400 }
      );
    }

    if (body.episodeNumber === undefined || body.episodeNumber === null) {
      return NextResponse.json(
        { error: 'episodeNumber is required' },
        { status: 400 }
      );
    }

    const result = await EpisodeManagementService.createEpisode({
      animeSlugOrId: body.animeSlugOrId || body.animeSlug || body.animeId,
      audioLanguage: body.audioLanguage || 'Japanese',
      seasonNumber: body.seasonNumber ? parseInt(body.seasonNumber, 10) : 1,
      episodeNumber: parseInt(body.episodeNumber, 10),
      youtubeUrlOrId: body.youtubeUrlOrId || body.youtubeVideoId,
      title: body.title,
      thumbnail: body.thumbnail,
      duration: body.duration,
      isPublished: body.isPublished,
      verificationStatus: body.verificationStatus,
      reviewerNotes: body.reviewerNotes,
      reviewerName: body.reviewerName || 'admin',
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = (error as Error).message;
    const isConflict = message.toLowerCase().includes('conflict');
    const isInvalid = message.toLowerCase().includes('invalid');
    const statusCode = isConflict ? 409 : isInvalid ? 400 : 500;

    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    );
  }
}
