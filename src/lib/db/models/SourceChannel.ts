import mongoose, { Schema, Model, Document } from 'mongoose';
import { ISourceChannel } from '@/types/anime';

export interface SourceChannelDocument extends Omit<ISourceChannel, '_id'>, Document {}

const SourceChannelSchema = new Schema<SourceChannelDocument>(
  {
    channelId: { type: String, required: true, unique: true, index: true },
    channelName: { type: String, required: true },
    officialSourceVerificationStatus: {
      type: String,
      enum: ['verified', 'pending', 'rejected'],
      default: 'pending',
      index: true,
    },
    isEnabled: { type: Boolean, default: true, index: true },
    customUrl: { type: String },
    sourceUrl: { type: String },
    feedUrl: { type: String },
    trackedAnimeSlugs: [{ type: String }],
    languages: [{ type: String }],
    playlistIds: [{ type: String }],
    lastSuccessfulCheckAt: { type: Date },
    lastAttemptedCheckAt: { type: Date },
    lastError: { type: String },
    description: { type: String },
    lastImportAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const SourceChannel: Model<SourceChannelDocument> =
  mongoose.models.SourceChannel ||
  mongoose.model<SourceChannelDocument>('SourceChannel', SourceChannelSchema);
