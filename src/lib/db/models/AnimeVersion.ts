import mongoose, { Schema, Model, Document } from 'mongoose';
import { IAnimeVersion } from '@/types/anime';

export interface AnimeVersionDocument extends Omit<IAnimeVersion, '_id' | 'anime' | 'sourceChannel'>, Document {
  anime: mongoose.Types.ObjectId;
  sourceChannel?: mongoose.Types.ObjectId;
}

const AnimeVersionSchema = new Schema<AnimeVersionDocument>(
  {
    anime: { type: Schema.Types.ObjectId, ref: 'Anime', required: true, index: true },
    audioLanguage: { type: String, required: true, index: true },
    subtitleLanguages: [{ type: String, trim: true, index: true }],
    sourceChannel: { type: Schema.Types.ObjectId, ref: 'SourceChannel' },
    channelName: { type: String, required: true },
    verificationStatus: {
      type: String,
      enum: ['verified', 'unverified', 'unavailable'],
      default: 'unverified',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

AnimeVersionSchema.index({ anime: 1, audioLanguage: 1 });

export const AnimeVersion: Model<AnimeVersionDocument> =
  mongoose.models.AnimeVersion ||
  mongoose.model<AnimeVersionDocument>('AnimeVersion', AnimeVersionSchema);
