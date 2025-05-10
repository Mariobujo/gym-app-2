import { MuscleGroup, Equipment } from './exercise.types';

// Routine Types

export enum RoutineObjective {
  STRENGTH = 'strength',
  HYPERTROPHY = 'hypertrophy',
  ENDURANCE = 'endurance',
  WEIGHT_LOSS = 'weightLoss',
  GENERAL_FITNESS = 'generalFitness',
  POWER = 'power',
  FLEXIBILITY = 'flexibility',
  REHABILITATION = 'rehabilitation',
  SPORT_SPECIFIC = 'sportSpecific'
}

export enum RoutineLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export enum CreatorType {
  SYSTEM = 'system',
  USER = 'user'
}

export enum SetType {
  NORMAL = 'normal',
  WARMUP = 'warmup',
  DROPSET = 'dropset',
  SUPERSET = 'superset'
}

export enum RepType {
  REPS = 'reps',
  TIME = 'time',
  FAILURE = 'failure'
}

export enum WeightUnitType {
  KG = 'kg',
  LB = 'lb',
  BODYWEIGHT = 'bodyweight',
  PERCENTAGE_1RM = '%1RM'
}

export enum WeightCalculationType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
  RPE = 'rpe'
}

export enum ProgressionType {
  LINEAR = 'linear',
  UNDULATING = 'undulating',
  PERCENTAGE = 'percentage'
}

export enum RoutineVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  FRIENDS = 'friends'
}

export interface RoutineSet {
  type: SetType;
  reps: {
    count: number;
    type: RepType;
  };
  weight?: {
    value: number;
    unit: WeightUnitType;
    calculation?: WeightCalculationType;
  };
  rest: number; // seconds
  tempo?: string; // e.g. "3-1-2-0" (eccentric-bottom-concentric-top)
}

export interface RoutineExercise {
  exerciseId: string;
  order: number;
  sets: RoutineSet[];
  notes?: string;
  supersetWith?: string[]; // Exercise IDs for superset
}

export interface RoutineWarmup {
  exerciseId: string;
  duration: number;
  sets?: number;
  reps?: number;
}

export interface RoutineProgression {
  type: ProgressionType;
  parameters: any; // Specific parameters based on progression type
}

export interface Routine {
  _id?: string;
  name: string;
  description: string;
  objective: RoutineObjective;
  level: RoutineLevel;
  creator: {
    type: CreatorType;
    id?: string; // User ID if creator type is USER
  };
  duration: {
    estimated: number; // minutes
    rest?: number; // seconds
  };
  schedule?: number[]; // Days of week (0-6, 0 is Sunday)
  frequency?: number; // Times per week
  exercises: RoutineExercise[];
  warmup?: RoutineWarmup[];
  cooldown?: RoutineWarmup[];
  progression?: RoutineProgression;
  equipment?: Equipment[];
  muscleGroups?: {
    primary: MuscleGroup[];
    secondary: MuscleGroup[];
  };
  metadata?: {
    estimatedCalories?: number;
    difficulty?: number; // 1-5
    tags?: string[];
    visibility: RoutineVisibility;
    featured?: boolean;
    rating?: number;
    ratingCount?: number;
    usedCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export interface RoutineSearchParams {
  query?: string;
  objective?: RoutineObjective;
  level?: RoutineLevel;
  equipment?: Equipment[];
  muscleGroups?: MuscleGroup[];
  duration?: {
    min?: number;
    max?: number;
  };
  creatorType?: CreatorType;
  userId?: string;
  limit?: number;
  page?: number;
}

export interface RoutineFilters {
  objective?: RoutineObjective[];
  level?: RoutineLevel[];
  equipment?: Equipment[];
  muscleGroups?: MuscleGroup[];
  duration?: {
    min?: number;
    max?: number;
  };
  creatorType?: CreatorType[];
}

export default {
  // Routine is a type and cannot be exported as a value
  RoutineObjective,
  RoutineLevel,
  CreatorType,
  SetType,
  RepType,
  WeightUnitType,
  WeightCalculationType,
  ProgressionType,
  RoutineVisibility
};