import mongoose, { Schema, Model, Document } from 'mongoose';
import { IEpisode } from '@/types/anime';

export interface EpisodeDocument extends Omit<IEpisode, '_id' | 'anime' | 'version'>, Document {
  anime: mongoose.Types.ObjectId;
  version: mongoose.Types.ObjectId;
}

const EpisodeSchema = new Schema<EpisodeDocument>(
  {
    anime: { type: Schema.Types.ObjectId, ref: 'Anime', required: true, index: true },
    version: { type: Schema.Types.ObjectId, ref: 'AnimeVersion', required: true, index: true },
    seasonNumber: { type: Number, required: true, default: 1 },
    episodeNumber: { type: Number, required: true },
    title: { type: String, required: true },
    youtubeVideoId: { type: String, required: true, index: true },
    videoUrl: { type: String },
    playlistId: { type: String },
    publicationDate: { type: Date },
    verificationStatus: {
      type: String,
      enum: ['discovered', 'pending_review', 'verified', 'unverified', 'rejected', 'unavailable'],
      default: 'unverified',
      index: true,
    },
    isPublished: { type: Boolean, default: false, index: true },
    isEmbeddable: { type: Boolean, default: true },
    duration: { type: String },
    thumbnail: { type: String },
    sourceChannelName: { type: String },
    sourceChannelId: { type: String },
    languageCode: { type: String, default: 'ja' },
    verifiedAt: { type: Date },
    verifiedBy: { type: String },
    verificationNotes: { type: String },
    lastAvailabilityCheckAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Unique compound index so an episode for a version is distinct
EpisodeSchema.index({ version: 1, seasonNumber: 1, episodeNumber: 1 }, { unique: true });
EpisodeSchema.index({ anime: 1, isPublished: 1, verificationStatus: 1 });
EpisodeSchema.index({ anime: 1, version: 1, isPublished: 1, seasonNumber: 1, episodeNumber: 1 });

export const Episode: Model<EpisodeDocument> =
  mongoose.models.Episode || mongoose.model<EpisodeDocument>('Episode', EpisodeSchema);
