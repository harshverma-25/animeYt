import mongoose, { Schema, Model, Document } from 'mongoose';
import { IImportJob } from '@/types/anime';

export interface ImportJobDocument extends Omit<IImportJob, '_id'>, Document {}

const ImportJobSchema = new Schema<ImportJobDocument>(
  {
    dataSource: {
      type: String,
      enum: ['anilist', 'youtube', 'availability_check'],
      required: true,
      index: true,
    },
    jobType: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    progress: { type: Number, default: 0 },
    processedCount: { type: Number, default: 0 },
    insertedCount: { type: Number, default: 0 },
    updatedCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    cursor: { type: String },
    errorSummary: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const ImportJob: Model<ImportJobDocument> =
  mongoose.models.ImportJob ||
  mongoose.model<ImportJobDocument>('ImportJob', ImportJobSchema);
