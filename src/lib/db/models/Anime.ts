import mongoose, { Schema, Model, Document } from 'mongoose';
import { IAnime } from '@/types/anime';

export interface AnimeDocument extends Omit<IAnime, '_id'>, Document {}

const AnimeSchema = new Schema<AnimeDocument>(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    synopsis: { type: String, required: true },
    poster: { type: String, required: true },
    backdrop: { type: String },
    genres: [{ type: String, trim: true, index: true }],
    releaseYear: { type: Number, required: true, index: true },
    status: {
      type: String,
      enum: ['Ongoing', 'Completed', 'Upcoming'],
      default: 'Completed',
    },
    isFeatured: { type: Boolean, default: false, index: true },
    popularityScore: { type: Number, default: 0, index: true },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for searching & listing
AnimeSchema.index({ title: 'text', synopsis: 'text' });
AnimeSchema.index({ popularityScore: -1, createdAt: -1 });

export const Anime: Model<AnimeDocument> =
  mongoose.models.Anime || mongoose.model<AnimeDocument>('Anime', AnimeSchema);
