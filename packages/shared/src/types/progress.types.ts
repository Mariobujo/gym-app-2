// Enum for types of body metrics
export enum MetricType {
    WEIGHT = 'weight',
    BODY_FAT = 'bodyFat',
    CHEST = 'chest',
    WAIST = 'waist',
    HIPS = 'hips',
    ARMS = 'arms',
    THIGHS = 'thighs'
  }
  
  // Interface for body metrics
  export interface BodyMetric {
    _id?: string;
    user: string;
    type: MetricType;
    value: number;
    date: Date;
    notes?: string;
  }
  
  // Interface for personal records
  export interface PersonalRecord {
    type: 'strength' | 'body' | 'endurance'; // Type of record
    
    // For strength records
    exerciseId?: string;
    exerciseName?: string;
    value?: number;
    reps?: number;
    volume?: number;
    workoutId?: string;
    
    // For body metrics records
    metricType?: MetricType;
    
    // Common fields
    date: Date;
    notes?: string;
  }
  
  // Interface for metric summary
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
    bmi?: number; // Only for weight metrics
  }
  
  // Interface for period metrics summary
  export interface PeriodMetricSummary {
    count: number;
    average: number | null;
    start: number | null;
    end: number | null;
    change: number | null;
  }
  
  // Interface for metric comparison between periods
  export interface MetricComparison {
    period1: {
      start: Date;
      end: Date;
      metrics: {
        [key in MetricType]?: PeriodMetricSummary;
      };
    };
    period2: {
      start: Date;
      end: Date;
      metrics: {
        [key in MetricType]?: PeriodMetricSummary;
      };
    };
    differences: {
      [key in MetricType]?: {
        averageDifference: number;
        percentChange: number | null;
        isPositive: boolean;
      };
    };
  }
  
  // Interface for Redux state
  export interface ProgressState {
    bodyMetrics: BodyMetric[] | null;
    personalRecords: PersonalRecord[] | null;
    summary: { [key in MetricType]?: MetricSummary } | null;
    loading: boolean;
    error: string | null;
  }
  
  // Interface for adding a body metric
  export interface AddBodyMetricPayload {
    type: MetricType;
    value: number;
    date?: Date;
    notes?: string;
  }