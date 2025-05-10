import { MetricType } from './progress.types';

/**
 * Interface for progress metric data
 */
export interface IProgress {
  _id?: string;
  user: string;
  type: MetricType;
  value: number;
  date: Date | string;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Interface for personal records
 */
export interface IRecord {
    // Existing properties of IRecord
    exerciseId?: string;
    type: 'weight' | 'volume' | 'reps' | 'endurance';
    date: string;
    value: number; // Added the missing 'value' property
    previous?: {
      value: number;
      date: string;
    };
  }
/**
 * Interface for progress summary data
 */
export interface IProgressSummary {
  latest: number;
  latestDate: Date | string;
  oldest: number;
  oldestDate: Date | string;
  count: number;
  average: number;
  min: number;
  max: number;
  change: {
    value: number;
    percent: number;
    isPositive: boolean;
  };
  bmi?: number; // Only present for weight metrics
}

/**
 * Interface for chart data points
 */
export interface IChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
  color?: string;
  isRecord?: boolean;
  notes?: string;
  value: number;
  date: string; // Add the 'date' property to match the usage in MetricDetail.tsx

}

/**
 * Interface for available metric types with metadata
 */
export interface IAvailableMetric {
  type: MetricType;
  label: string;
  unit: string;
  description: string;
  icon?: string;
  defaultGoal?: 'increase' | 'decrease' | 'maintain';
  color?: string;
  recommended?: boolean;
}

// Export constant for available metrics with their metadata
export const AVAILABLE_METRICS: IAvailableMetric[] = [
  {
    type: MetricType.WEIGHT,
    label: 'Weight',
    unit: 'kg',
    description: 'Total body weight',
    icon: 'scale',
    defaultGoal: 'maintain',
    color: '#3D5AFE',
    recommended: true
  },
  {
    type: MetricType.BODY_FAT,
    label: 'Body Fat',
    unit: '%',
    description: 'Percentage of body fat',
    icon: 'percent',
    defaultGoal: 'decrease',
    color: '#FF6D00',
    recommended: true
  },
  {
    type: MetricType.CHEST,
    label: 'Chest',
    unit: 'cm',
    description: 'Chest circumference',
    icon: 'fitness',
    defaultGoal: 'increase',
    color: '#4CAF50'
  },
  {
    type: MetricType.WAIST,
    label: 'Waist',
    unit: 'cm',
    description: 'Waist circumference',
    icon: 'resize',
    defaultGoal: 'decrease',
    color: '#F44336',
    recommended: true
  },
  {
    type: MetricType.HIPS,
    label: 'Hips',
    unit: 'cm',
    description: 'Hip circumference',
    icon: 'body',
    defaultGoal: 'maintain',
    color: '#9C27B0'
  },
  {
    type: MetricType.ARMS,
    label: 'Arms',
    unit: 'cm',
    description: 'Arm circumference (biceps)',
    icon: 'arm',
    defaultGoal: 'increase',
    color: '#2196F3'
  },
  {
    type: MetricType.THIGHS,
    label: 'Thighs',
    unit: 'cm',
    description: 'Thigh circumference',
    icon: 'leg',
    defaultGoal: 'increase',
    color: '#009688'
  }
];

// Helper functions

/**
 * Get metadata for a specific metric type
 * @param type - Metric type to get metadata for
 */
export const getMetricMetadata = (type: MetricType): IAvailableMetric | undefined => {
  return AVAILABLE_METRICS.find(metric => metric.type === type);
};

/**
 * Get unit for a specific metric type
 * @param type - Metric type to get unit for
 */
export const getMetricUnit = (type: MetricType): string => {
  const metric = getMetricMetadata(type);
  return metric ? metric.unit : '';
};

/**
 * Check if a change in value is positive based on metric type
 * @param type - Metric type
 * @param change - Value change
 */
export const isPositiveChange = (type: MetricType, change: number): boolean => {
  const metric = getMetricMetadata(type);
  
  if (!metric) return change > 0;
  
  // For metrics where decrease is the goal, negative change is positive
  if (metric.defaultGoal === 'decrease') {
    return change < 0;
  }
  
  // For metrics where increase is the goal, positive change is positive
  if (metric.defaultGoal === 'increase') {
    return change > 0;
  }
  
  // For metrics where maintenance is the goal, smaller absolute change is positive
  return Math.abs(change) < 0.05 * change; // Within 5% is considered maintenance
};

export default {
  AVAILABLE_METRICS,
  getMetricMetadata,
  getMetricUnit,
  isPositiveChange
};