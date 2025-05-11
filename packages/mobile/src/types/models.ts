export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Exercise {
    id: string;
    name: string;
    description: string;
    muscleGroups: string[];
    equipment: string[];
    difficulty: number;
    instructions: string[];
    gifUrl?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Routine {
    id: string;
    name: string;
    description: string;
    creatorId: string;
    exercises: RoutineExercise[];
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface RoutineExercise {
    exerciseId: string;
    sets: number;
    reps: number;
    restTime: number;
    order: number;
  }
  
  export interface Workout {
    id: string;
    userId: string;
    routineId: string;
    startTime: Date;
    endTime?: Date;
    exercises: WorkoutExercise[];
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface WorkoutExercise {
    exerciseId: string;
    sets: WorkoutSet[];
  }
  
  export interface WorkoutSet {
    weight: number;
    reps: number;
    completed: boolean;
  }
  // Constantes compartidas

export const MUSCLE_GROUPS = [
    'chest',
    'back',
    'shoulders',
    'legs',
    'arms',
    'core',
    'fullBody'
  ] as const;
  
  export const EQUIPMENT = [
    'bodyweight',
    'barbell',
    'dumbbell',
    'machine',
    'cable',
    'kettlebell',
    'resistance band',
    'other'
  ] as const;
  
  export const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;

  // Utilidades compartidas

export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  export function calculateTotalVolume(weight: number, sets: number, reps: number): number {
    return weight * sets * reps;
  }
  