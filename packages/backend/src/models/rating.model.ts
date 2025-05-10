// src/models/rating.model.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IRating extends Document {
  user: mongoose.Types.ObjectId;
  routine: mongoose.Types.ObjectId;
  rating: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema: Schema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  routine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Routine',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure a user can only rate a routine once
RatingSchema.index({ user: 1, routine: 1 }, { unique: true });

export default mongoose.model<IRating>('Rating', RatingSchema);