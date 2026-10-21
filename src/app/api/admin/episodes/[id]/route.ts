import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, unauthorizedResponse } from '@/lib/auth/adminAuth';
import { EpisodeManagementService } from '@/lib/services/episodeManagementService';
import { Episode } from '@/lib/db/models/Episode';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    await connectToDatabase();
    const episode = await Episode.findById(id)
      .populate('anime', 'title slug poster')
      .populate('version', 'audioLanguage channelName')
      .lean();

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: episode });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const result = await EpisodeManagementService.updateEpisode(id, {
      title: body.title,
      seasonNumber: body.seasonNumber !== undefined ? parseInt(body.seasonNumber, 10) : undefined,
      episodeNumber: body.episodeNumber !== undefined ? parseInt(body.episodeNumber, 10) : undefined,
      youtubeUrlOrId: body.youtubeUrlOrId || body.youtubeVideoId,
      thumbnail: body.thumbnail,
      duration: body.duration,
      isPublished: body.isPublished,
      verificationStatus: body.verificationStatus,
      reviewerNotes: body.reviewerNotes,
      reviewerName: body.reviewerName,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = (error as Error).message;
    const isConflict = message.toLowerCase().includes('conflict');
    const isNotFound = message.toLowerCase().includes('not found');
    const statusCode = isNotFound ? 404 : isConflict ? 409 : 400;

    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(req, { params });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const result = await EpisodeManagementService.deleteEpisode(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = (error as Error).message;
    const isNotFound = message.toLowerCase().includes('not found');
    return NextResponse.json(
      { success: false, error: message },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
