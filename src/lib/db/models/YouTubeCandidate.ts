import mongoose, { Schema, Model, Document } from 'mongoose';
import { IYouTubeCandidate } from '@/types/anime';

export interface YouTubeCandidateDocument extends Omit<IYouTubeCandidate, '_id' | 'candidateAnimeId' | 'publishedEpisodeId'>, Document {
  candidateAnimeId?: mongoose.Types.ObjectId;
  publishedEpisodeId?: mongoose.Types.ObjectId;
}

const YouTubeCandidateSchema = new Schema<YouTubeCandidateDocument>(
  {
    youtubeVideoId: { type: String, required: true, unique: true, index: true },
    channelId: { type: String, required: true, index: true },
    channelTitle: { type: String, required: true },
    playlistId: { type: String },
    videoTitle: { type: String, required: true },
    videoDescription: { type: String, default: '' },
    thumbnailUrl: { type: String },
    duration: { type: String },
    candidateAnimeId: { type: Schema.Types.ObjectId, ref: 'Anime', index: true },
    candidateAnimeSlug: { type: String, index: true },
    candidateEpisodeNumber: { type: Number, default: 1 },
    candidateSeasonNumber: { type: Number, default: 1 },
    claimedLanguage: { type: String, default: 'Japanese' },
    discoveryMethod: {
      type: String,
      enum: ['channel_playlist', 'channel_search', 'targeted_search', 'manual'],
      default: 'channel_playlist',
    },
    verificationStatus: {
      type: String,
      enum: ['discovered', 'pending_review', 'verified', 'rejected', 'unavailable'],
      default: 'discovered',
      index: true,
    },
    reviewerNotes: { type: String },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    publishedEpisodeId: { type: Schema.Types.ObjectId, ref: 'Episode' },
    lastAvailabilityCheckAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

YouTubeCandidateSchema.index({ channelId: 1, verificationStatus: 1 });

export const YouTubeCandidate: Model<YouTubeCandidateDocument> =
  mongoose.models.YouTubeCandidate ||
  mongoose.model<YouTubeCandidateDocument>('YouTubeCandidate', YouTubeCandidateSchema);
