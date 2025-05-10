// packages/shared/src/types/workout.types.ts

import { Exercise } from './exercise.types';
import { Routine } from './routine.types';
import { User } from './user.types';

export interface IWorkoutSet {
  exercise: string | Exercise;
  sets: Array<{
    weight: number;
    reps: number;
    duration?: number;
    rpe?: number;
    completed: boolean;
    isPersonalRecord?: boolean;
    notes?: string;
  }>;
  notes?: string;
}

export interface IWorkout {
  id?: string;
  user: string | User;
  routine: string | Routine;
  startTime: Date;
  endTime?: Date;
  duration?: number;
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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWorkoutStats {
  overall: {
    count: number;
    totalDuration: number;
    totalVolume: number;
    personalRecords: number;
    averageDuration?: number;
  };
  dayDistribution: Array<{
    _id: number;
    count: number;
  }>;
  topRoutines: Array<{
    routine: string;
    count: number;
    totalVolume: number;
    averageDuration: number;
  }>;
}