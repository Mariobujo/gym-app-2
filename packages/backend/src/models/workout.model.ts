// src/models/workout.model.ts

import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';
import { IRoutine } from './routine.model';
import { IExercise } from './exercise.model';

export interface IWorkoutSet extends Document {
  exercise: mongoose.Types.ObjectId | IExercise;
  sets: Array<{
    weight: number;
    reps: number;
    duration?: number; // Para ejercicios basados en tiempo
    rpe?: number; // Rate of Perceived Exertion
    completed: boolean;
    isPersonalRecord: boolean;
    notes?: string;
  }>;
  notes?: string;
}

export interface IWorkout extends Document {
  user: mongoose.Types.ObjectId | IUser;
  routine: mongoose.Types.ObjectId | IRoutine;
  startTime: Date;
  endTime?: Date;
  duration?: number; // En segundos
  status: 'in_progress' | 'completed' | 'aborted';
  exercises: IWorkoutSet[];
  metrics?: {
    totalVolume?: number;
    totalReps?: number;
    caloriesBurned?: number;
    personalRecords?: number;
  };
  location?: {
    type: string;
    name?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutSetSchema: Schema = new Schema({
  exercise: {
    type: Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  sets: [{
    weight: {
      type: Number,
      required: true
    },
    reps: {
      type: Number,
      required: true
    },
    duration: {
      type: Number
    },
    rpe: {
      type: Number,
      min: 1,
      max: 10
    },
    completed: {
      type: Boolean,
      default: true
    },
    isPersonalRecord: {
      type: Boolean,
      default: false
    },
    notes: String
  }],
  notes: String
});

const WorkoutSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  routine: {
    type: Schema.Types.ObjectId,
    ref: 'Routine',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'aborted'],
    default: 'in_progress'
  },
  exercises: [WorkoutSetSchema],
  metrics: {
    totalVolume: Number,
    totalReps: Number,
    caloriesBurned: Number,
    personalRecords: Number
  },
  location: {
    type: {
      type: String,
      enum: ['gym', 'home', 'outdoor', 'other'],
      default: 'gym'
    },
    name: String
  },
  notes: String
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento de consultas
WorkoutSchema.index({ user: 1, startTime: -1 });
WorkoutSchema.index({ routine: 1 });
WorkoutSchema.index({ status: 1 });
WorkoutSchema.index({ 'exercises.exercise': 1 });

export default mongoose.model<IWorkout>('Workout', WorkoutSchema);