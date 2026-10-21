import mongoose, { Schema, Model, Document } from 'mongoose';
import { IAnime } from '@/types/anime';

export interface AnimeDocument extends Omit<IAnime, '_id'>, Document {}

const AnimeSchema = new Schema<AnimeDocument>(
  {
    anilistId: { type: Number, unique: true, sparse: true, index: true },
    title: { type: String, required: true, trim: true, index: true },
    englishTitle: { type: String, trim: true },
    romajiTitle: { type: String, trim: true },
    nativeTitle: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    synopsis: { type: String, default: '' },
    poster: { type: String, default: '' },
    backdrop: { type: String, default: '' },
    genres: [{ type: String, trim: true, index: true }],
    format: { type: String, default: 'TV' },
    releaseYear: { type: Number, required: true, index: true },
    status: {
      type: String,
      enum: ['Ongoing', 'Completed', 'Upcoming'],
      default: 'Completed',
    },
    isFeatured: { type: Boolean, default: false, index: true },
    popularityScore: { type: Number, default: 0, index: true },
    rating: { type: String, default: 'N/A' },
    verifiedEpisodeCount: { type: Number, default: 0, index: true },
    externalMetadataSource: { type: String, default: 'anilist' },
    metadataLastSyncedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Compound text index & sorting indexes
AnimeSchema.index({ title: 'text', synopsis: 'text', englishTitle: 'text', romajiTitle: 'text' });
AnimeSchema.index({ popularityScore: -1, createdAt: -1 });
AnimeSchema.index({ releaseYear: -1, popularityScore: -1 });
AnimeSchema.index({ genres: 1, popularityScore: -1 });
AnimeSchema.index({ verifiedEpisodeCount: 1, popularityScore: -1 });

export const Anime: Model<AnimeDocument> =
  mongoose.models.Anime || mongoose.model<AnimeDocument>('Anime', AnimeSchema);
