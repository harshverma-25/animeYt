import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SourceChannel } from '@/lib/db/models/SourceChannel';
import { isAuthorizedAdmin, unauthorizedResponse } from '@/lib/auth/adminAuth';
import { AutoEpisodeDetectionService } from '@/lib/services/autoEpisodeDetectionService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    await connectToDatabase();
    const summary = await AutoEpisodeDetectionService.getObservabilitySummary();
    const sources = await SourceChannel.find().sort({ createdAt: -1 });

    return NextResponse.json({
      sources,
      summary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch source channels' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    await connectToDatabase();
    const body = await req.json();
    const {
      channelId,
      channelName,
      customUrl,
      sourceUrl,
      feedUrl,
      languages,
      trackedAnimeSlugs,
      playlistIds,
      isEnabled,
      officialSourceVerificationStatus,
    } = body;

    if (!channelId || !channelName) {
      return NextResponse.json(
        { error: 'channelId and channelName are required' },
        { status: 400 }
      );
    }

    const defaultFeedUrl =
      feedUrl || `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    const source = await SourceChannel.findOneAndUpdate(
      { channelId },
      {
        $set: {
          channelName,
          customUrl: customUrl || sourceUrl,
          sourceUrl: sourceUrl || customUrl,
          feedUrl: defaultFeedUrl,
          languages: Array.isArray(languages) ? languages : ['Hindi'],
          trackedAnimeSlugs: Array.isArray(trackedAnimeSlugs) ? trackedAnimeSlugs : [],
          playlistIds: Array.isArray(playlistIds) ? playlistIds : [],
          isEnabled: isEnabled !== undefined ? isEnabled : true,
          officialSourceVerificationStatus:
            officialSourceVerificationStatus || 'verified',
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, source });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to save source channel' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return unauthorizedResponse();
  }

  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, channelId, ...updates } = body;

    const query = id ? { _id: id } : channelId ? { channelId } : null;
    if (!query) {
      return NextResponse.json(
        { error: 'Must provide source id or channelId to update' },
        { status: 400 }
      );
    }

    const source = await SourceChannel.findOneAndUpdate(
      query,
      { $set: updates },
      { new: true }
    );

    if (!source) {
      return NextResponse.json({ error: 'Source channel not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, source });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update source channel' },
      { status: 500 }
    );
  }
}
