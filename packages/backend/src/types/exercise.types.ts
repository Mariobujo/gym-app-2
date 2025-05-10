// Exercise Types

export enum ExerciseType {
    STRENGTH = 'strength',
    CARDIO = 'cardio',
    FLEXIBILITY = 'flexibility',
    BALANCE = 'balance',
    PLYOMETRIC = 'plyometric',
    FUNCTIONAL = 'functional'
  }
  
  export enum ExerciseMechanics {
    COMPOUND = 'compound',
    ISOLATION = 'isolation'
  }
  
  export enum MuscleGroup {
    CHEST = 'chest',
    BACK = 'back',
    SHOULDERS = 'shoulders',
    BICEPS = 'biceps',
    TRICEPS = 'triceps',
    FOREARMS = 'forearms',
    QUADRICEPS = 'quadriceps',
    HAMSTRINGS = 'hamstrings',
    GLUTES = 'glutes',
    CALVES = 'calves',
    ABS = 'abs',
    LOWER_BACK = 'lowerBack',
    FULL_BODY = 'fullBody',
    CARDIO = 'cardio'
  }
  
  export enum Equipment {
    BARBELL = 'barbell',
    DUMBBELL = 'dumbbell',
    KETTLEBELL = 'kettlebell',
    MACHINE = 'machine',
    CABLE = 'cable',
    BODYWEIGHT = 'bodyweight',
    RESISTANCE_BAND = 'resistanceBand',
    MEDICINE_BALL = 'medicineBall',
    STABILITY_BALL = 'stabilityBall',
    TRX = 'trx',
    OTHER = 'other'
  }
  
  export enum DifficultyLevel {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced',
    EXPERT = 'expert'
  }
  
  export enum ForceType {
    PUSH = 'push',
    PULL = 'pull',
    STATIC = 'static'
  }
  
  export interface ExerciseMedia {
    gifUrl?: string;
    thumbnailUrl?: string;
    videoUrl?: string;
    images?: string[];
  }
  
  export interface ExerciseMetrics {
    force?: ForceType;
    mechanic?: ExerciseMechanics;
    level?: DifficultyLevel;
    weightType?: string;
  }
  
  export interface Exercise {
    _id?: string;
    name: string;
    description: string;
    instructions: string[];
    type: ExerciseType;
    mechanics: ExerciseMechanics;
    equipment: Equipment[];
    difficultyLevel: DifficultyLevel;
    muscleGroups: {
      primary: MuscleGroup[];
      secondary: MuscleGroup[];
    };
    metrics?: ExerciseMetrics;
    media?: ExerciseMedia;
    variations?: string[];
    alternatives?: string[];
    metadata?: {
      popularity?: number;
      rating?: number;
      createdBy?: string;
      public?: boolean;
      tags?: string[];
      createdAt?: Date;
      updatedAt?: Date;
    };
  }
  
  export interface ExerciseSearchParams {
    query?: string;
    type?: ExerciseType;
    equipment?: Equipment[];
    muscleGroups?: MuscleGroup[];
    difficultyLevel?: DifficultyLevel;
    limit?: number;
    page?: number;
  }
  
  export interface ExerciseFilters {
    type?: ExerciseType[];
    equipment?: Equipment[];
    muscleGroups?: MuscleGroup[];
    difficultyLevel?: DifficultyLevel[];
    mechanics?: ExerciseMechanics[];
  }
  
  export default {
    ExerciseType,
    ExerciseMechanics,
    MuscleGroup,
    Equipment,
    DifficultyLevel,
    ForceType
  };

  // Removed duplicate named export for Exercise to avoid conflict