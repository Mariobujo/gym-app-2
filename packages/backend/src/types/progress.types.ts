// packages/shared/src/types/progress.types.ts

import { Exercise } from './exercise.types';

export interface IProgress {
  id?: string;
  user: string;
  type: 'body' | 'performance' | 'exercise' | 'habit';
  metric: string;
  date: Date;
  value: number;
  unit: string;
  context?: {
    workout?: string;
    exercise?: string | Exercise;
    notes?: string;
  };
  source: 'manual' | 'workout' | 'wearable' | 'import';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRecord {
  id?: string;
  user: string;
  exercise: string | Exercise;
  type: 'weight' | 'reps' | 'volume' | 'duration';
  value: number;
  date: Date;
  workout: string;
  previous?: {
    value: number;
    date: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProgressSummary {
  period: string;
  workouts: {
    count: number;
    change: number;
  };
  volume: {
    total: number;
    change: number;
  };
  duration: {
    total: number;
    perWorkout: number;
  };
  records: number;
  consistency: {
    uniqueDays: number;
    percentage: number;
  };
}

export interface IChartDataPoint {
  date: Date;
  value: number;
}

export interface IAvailableMetric {
  _id: {
    type: string;
    metric: string;
  };
  count: number;
  unit: string;
  lastUpdate: Date;
}
// Define and export MetricType if it doesn't exist
export enum MetricType {
  WEIGHT = 'weight',
  BODY_FAT = 'body_fat',
  CHEST = 'chest',
  WAIST = 'waist',
  HIPS = 'hips',
  ARMS = 'arms',
  THIGHS = 'thighs'
}
// Add missing exports
export interface BodyMetric {
  user: string;
  type: MetricType;
  value: number;
  date: Date;
  notes?: string;
}

export interface PersonalRecord {
  type: string;
  exerciseId?: string;
  exerciseName?: string;
  value: number;
  reps?: number;
  volume?: number;
  date: Date;
  workoutId?: string;
  metricType?: MetricType;
  notes?: string;
}

export interface MetricSummary {
  latest: number;
  latestDate: Date;
  oldest: number;
  oldestDate: Date;
  count: number;
  average: number;
  min: number;
  max: number;
  change: {
    value: number;
    percent: number;
    isPositive: boolean;
  };
  bmi?: number;
}

export interface MetricComparison {
  period1: {
    start: Date;
    end: Date;
    metrics: Record<MetricType, MetricSummary>;
  };
  period2: {
    start: Date;
    end: Date;
    metrics: Record<MetricType, MetricSummary>;
  };
  differences: Record<MetricType, {
    averageDifference: number;
    percentChange: number | null;
    isPositive: boolean;
  }>;
}