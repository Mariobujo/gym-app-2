  // packages/shared/types/index.ts

export interface IWorkoutSet {
  id?: string;
  exerciseId: string;
  sets: number;
  reps: number;
  weight: number;
  completed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWorkout {
  id?: string;
  userId: string;
  routineId?: string;
  title: string;
  description?: string;
  status: 'planned' | 'in_progress' | 'completed';
  scheduledFor?: Date;
  completedAt?: Date;
  exercises: IWorkoutSet[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWorkoutStats {
  totalWorkouts: number;
  completedWorkouts: number;
  totalDuration?: number;
  averageDuration?: number;
  // Otras estadísticas que necesites
}