// src/models/record.model.ts

import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';
import { IExercise } from './exercise.model';

export interface IRecord extends Document {
  user: mongoose.Types.ObjectId | IUser;
  exercise: mongoose.Types.ObjectId | IExercise;
  type: 'weight' | 'reps' | 'volume' | 'duration';
  value: number;
  date: Date;
  workout: mongoose.Types.ObjectId;
  previous?: {
    value: number;
    date: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RecordSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exercise: {
    type: Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  type: {
    type: String,
    enum: ['weight', 'reps', 'volume', 'duration'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  workout: {
    type: Schema.Types.ObjectId,
    ref: 'Workout',
    required: true
  },
  previous: {
    value: Number,
    date: Date
  }
}, {
  timestamps: true
});

// Índices para consultas
RecordSchema.index({ user: 1, exercise: 1, type: 1 }, { unique: true });
RecordSchema.index({ user: 1, date: -1 });

export default mongoose.model<IRecord>('Record', RecordSchema);