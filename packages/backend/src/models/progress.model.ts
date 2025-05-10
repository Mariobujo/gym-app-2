import mongoose, { Schema, Document } from 'mongoose';
import { MetricType } from '../types/progress.types';

// Define the Progress Metric schema
const ProgressMetricSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['weight', 'bodyFat', 'waist', 'chest', 'arms', 'thighs']
  },
  value: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  notes: {
    type: String
  }
});


// Create compound index for user+type+date for efficient querying
ProgressMetricSchema.index({ user: 1, type: 1, date: -1 });

// Middleware to validate metric values based on type
ProgressMetricSchema.pre('save', function(this: ProgressMetricDocument, next) {
  // Validate weight (must be positive and reasonable)
  if (this.type === MetricType.WEIGHT && (this.value <= 0 || this.value > 500)) {
    return next(new Error('Weight must be a positive number less than 500 kg'));
  }
  
  // Validate body fat percentage (between 0 and 100)
  if (this.type === MetricType.BODY_FAT && (this.value < 0 || this.value > 100)) {
    return next(new Error('Body fat percentage must be between 0 and 100'));
  }
  
  // Validate measurements (must be positive and reasonable)
  if (
    (this.type === MetricType.CHEST || 
     this.type === MetricType.WAIST ||
     this.type === MetricType.HIPS ||
     this.type === MetricType.ARMS ||
     this.type === MetricType.THIGHS) && 
     (this.value <= 0 || this.value > 300)
  ) {
    return next(new Error(`${this.type} measurement must be a positive number less than 300 cm`));
  }
  
  next();
});
export interface ProgressMetricDocument extends Document {
  user: mongoose.Types.ObjectId;
  type: MetricType;
  value: number;
  date: Date;
  notes?: string;
}

export const ProgressMetricModel = mongoose.model<ProgressMetricDocument>('ProgressMetric', ProgressMetricSchema);

// Define type for the document
export interface ProgressMetricDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
  value: number;
}

// Create and export the model
const ProgressMetric = mongoose.model<ProgressMetricDocument>('ProgressMetric', ProgressMetricSchema);

export default ProgressMetric;