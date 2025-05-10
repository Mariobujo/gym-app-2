// User Types

export enum UserRole {
    PREMIUM = 'premium',
    COACH = 'coach',
    ADMIN = 'ADMIN',
    USER = 'USER',
    SUPER_ADMIN = 'SUPER_ADMIN',
  }
  
  export enum AuthProvider {
    LOCAL = 'local',
    GOOGLE = 'google',
    APPLE = 'apple',
    FACEBOOK = 'facebook'
  }
  
  export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
    OTHER = 'other',
    PREFER_NOT_TO_SAY = 'preferNotToSay'
  }
  
  export enum FitnessLevel {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced'
  }
  
  export enum FitnessGoal {
    STRENGTH = 'strength',
    HYPERTROPHY = 'hypertrophy',
    WEIGHT_LOSS = 'weight_loss',
    ENDURANCE = 'endurance',
    GENERAL_FITNESS = 'general_fitness',
    HEALTH = 'health',
    REHABILITATION = 'rehabilitation'
  }
  
  export enum ProfileVisibility {
    PUBLIC = 'public',
    FRIENDS = 'friends',
    PRIVATE = 'private'
  }
  
  export enum MeasurementUnit {
    METRIC = 'metric',
    IMPERIAL = 'imperial'
  }
  
  export enum SubscriptionPlan {
    FREE = 'free',
    PREMIUM = 'premium',
    COACH = 'coach'
  }
  
  export enum SubscriptionStatus {
    ACTIVE = 'active',
    TRIAL = 'trial',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled',
    PENDING = 'pending'
  }
  
  export interface AuthProviderInfo {
    type: AuthProvider;
    providerId?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  }
  
  export interface UserProfile {
    firstName: string;
    lastName: string;
    displayName?: string;
    birthdate?: Date;
    gender?: string;
    weight?: number;
    weightUnit: MeasurementUnit;
    height?: number;
    fitnessLevel?: FitnessLevel;
    goals?: FitnessGoal[];
    equipmentAvailable?: string[];
    avatar?: string;
    bio?: string;
  }
  
  export interface UserSettings {
    notifications: {
      workout: boolean;
      achievements: boolean;
      reminders: boolean;
      marketing: boolean;
    };
    privacy: {
      profileVisibility: ProfileVisibility;
      progressVisibility: ProfileVisibility;
      workoutVisibility: ProfileVisibility;
    };
    preferences: {
      darkMode: boolean;
      language: string;
      units: MeasurementUnit;
      workoutSettings: {
        countdownTime: number;
        restTimers: boolean;
        audioFeedback: boolean;
      };
    };
  }
  
  export interface UserStats {
    workoutsCompleted: number;
    totalWorkoutTime: number;
    totalCaloriesBurned: number;
    streakDays: number;
    lastWorkoutDate?: Date;
    level: number;
    xp: number;
    achievements: number;
  }
  
  export interface UserSubscription {
    plan: SubscriptionPlan;
    startDate?: Date;
    endDate?: Date;
    status: SubscriptionStatus;
    paymentMethod?: any;
  }
  
  export interface UserDevice {
    deviceId: string;
    deviceType: string;
    notificationToken?: string;
    lastLogin: Date;
  }
  
  export interface UserSocial {
    followers: number;
    following: number;
    friends: string[]; // User IDs
  }
  
  export interface UserMetadata {
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
    active: boolean;
    verified: boolean;
  }
  
  export interface User {
    _id?: string;
    email: string;
    passwordHash?: string;
    role: UserRole;
    authProvider: AuthProviderInfo;
    profile: UserProfile;
    settings: UserSettings;
    stats: UserStats;
    subscription: UserSubscription;
    devices?: UserDevice[];
    social?: UserSocial;
    metadata: UserMetadata;
  }
  
  export interface UserCreateDTO {
    email: string;
    password: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      displayName?: string;
    };
  }
  
  export interface UserLoginDTO {
    email: string;
    password: string;
  }
  
  export interface UserUpdateDTO {
    profile?: Partial<UserProfile>;
    settings?: Partial<UserSettings>;
  }
  
  export interface UserAuthResponse {
    user: Omit<User, 'passwordHash'> & { emailVerified: boolean };
    tokens: {
      accessToken: string;
      refreshToken?: string;
    };
  }
  
  export default {
    UserRole,
    AuthProvider,
    Gender,
    FitnessLevel,
    FitnessGoal,
    ProfileVisibility,
    MeasurementUnit,
    SubscriptionPlan,
    SubscriptionStatus
  };