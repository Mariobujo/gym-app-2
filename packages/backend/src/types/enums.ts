// src/types/enums.ts

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  SUPER_ADMIN = 'SUPER_ADMIN',
}
  
  export enum FitnessLevel {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced'
  }
  
  export enum WeightUnit {
    KG = 'kg',
    LB = 'lb'
  }
  
  export enum HeightUnit {
    CM = 'cm',
    IN = 'in'
  }
  
  export enum WorkoutStatus {
    PLANNED = 'planned',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
  }
  
  export enum ExerciseType {
    STRENGTH = 'strength',
    CARDIO = 'cardio',
    FLEXIBILITY = 'flexibility',
    BALANCE = 'balance',
    PLYOMETRIC = 'plyometric'
  }
  
  export enum ExerciseMechanic {
    COMPOUND = 'compound',
    ISOLATION = 'isolation'
  }
  
  export enum ExerciseForce {
    PUSH = 'push',
    PULL = 'pull',
    STATIC = 'static'
  }
  
  export enum ExerciseEquipment {
    BARBELL = 'barbell',
    DUMBBELL = 'dumbbell',
    MACHINE = 'machine',
    CABLE = 'cable',
    BODYWEIGHT = 'bodyweight',
    KETTLEBELL = 'kettlebell',
    RESISTANCE_BAND = 'resistance_band',
    OTHER = 'other'
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
    CALVES = 'calves',
    GLUTES = 'glutes',
    ABS = 'abs',
    LOWER_BACK = 'lower_back',
    TRAPS = 'traps',
    LATS = 'lats',
    FULL_BODY = 'full_body'
  }