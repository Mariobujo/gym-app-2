import mongoose from 'mongoose';
import ProgressMetric from '../models/progress.model';
import User from '../models/user.model';
import Workout from '../models/workout.model';
import { BodyMetric, MetricType, PersonalRecord, MetricSummary, MetricComparison } from '../types/progress.types';
import { AppError } from '../utils/errors';

/**
 * Get all metrics for a user
 */
export const getUserMetrics = async (userId: string): Promise<BodyMetric[]> => {
  const metrics = await ProgressMetric.find({ user: userId })
    .sort({ date: -1 })
    .lean();
  
  return metrics.map(metric => ({
    user: metric.user.toString(),
    date: metric.date,
    type: metric.type,
    value: metric.value,
    notes: metric.notes
  })) as BodyMetric[];
};

/**
 * Get metrics by type for a user
 */
export const getMetricsByType = async (userId: string, type: MetricType): Promise<BodyMetric[]> => {
  const metrics = await ProgressMetric.find({ 
    user: userId,
    type
  })
    .sort({ date: -1 })
    .lean();
  
  return metrics.map(metric => ({
    ...metric,
    user: metric.user.toString()
  }));
};

/**
 * Get metrics by date range for a user
 */
export const getMetricsByDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date,
  type?: MetricType
): Promise<BodyMetric[]> => {
  const query: any = {
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (type) {
    query.type = type;
  }
  
  const metrics = await ProgressMetric.find(query)
    .sort({ date: -1 })
    .lean();
  
  return metrics.map(metric => ({
    ...metric,
    user: metric.user.toString()
  }));
};

/**
 * Get summary of all metrics for a user
 */
export const getMetricsSummary = async (userId: string): Promise<{ [key in MetricType]?: MetricSummary }> => {
  const user = await User.findById(userId).select('profile.height').lean();
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Get all metrics for the user
  const metrics = await ProgressMetric.find({ user: userId }).lean();
  
  // Group metrics by type
  const metricsByType = metrics.reduce((acc, metric) => {
    if (!acc[metric.type]) {
      acc[metric.type] = [];
    }
    acc[metric.type].push({
      ...metric,
      user: metric.user.toString()
    });
    return acc;
  }, {} as { [key in MetricType]: BodyMetric[] });
  
  // Calculate summary for each type
  const summary: { [key in MetricType]?: MetricSummary } = {};
  
  for (const type in metricsByType) {
    const typeMetrics = metricsByType[type as MetricType];
    
    if (typeMetrics.length > 0) {
      // Sort by date
      typeMetrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const latest = typeMetrics[typeMetrics.length - 1];
      const oldest = typeMetrics[0];
      const values = typeMetrics.map(m => m.value);
      
      // Calculate statistics
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      // Calculate change
      const changeValue = latest.value - oldest.value;
      const changePercent = (changeValue / oldest.value) * 100;
      
      // Add BMI if it's weight
      let bmi = null;
      if (type === MetricType.WEIGHT && user.profile?.height) {
        // BMI formula: weight(kg) / height(m)^2
        const heightInMeters = user.profile.height / 100; // Convert from cm to m
        bmi = latest.value / (heightInMeters * heightInMeters);
      }
      
      summary[type as MetricType] = {
        latest: latest.value,
        latestDate: latest.date,
        oldest: oldest.value,
        oldestDate: oldest.date,
        count: typeMetrics.length,
        average: avg,
        min,
        max,
        change: {
          value: changeValue,
          percent: changePercent,
          isPositive: isChangePositive(type as MetricType, changeValue)
        },
        ...(bmi && { bmi })
      };
    }
  }
  
  return summary;
};

/**
 * Add a new metric for a user
 */
export const addMetric = async (
  userId: string,
  metricData: {
    type: MetricType;
    value: number;
    date: Date;
    notes?: string;
  }
): Promise<BodyMetric> => {
  const { type, value, date, notes } = metricData;
  
  // Check if the user exists
  const userExists = await User.exists({ _id: userId });
  if (!userExists) {
    throw new AppError('User not found', 404);
  }
  
  // Create the new metric
  const newMetric = new ProgressMetric({
    user: userId,
    type,
    value,
    date,
    notes
  });
  
  await newMetric.save();
  
  return newMetric.toObject();
};

/**
 * Update an existing metric
 */
export const updateMetric = async (
  userId: string,
  metricId: string,
  updates: Partial<BodyMetric>
): Promise<BodyMetric | null> => {
  // Ensure the metric belongs to the user
  const metric = await ProgressMetric.findOne({
    _id: metricId,
    user: userId
  });
  
  if (!metric) {
    return null;
  }
  
  // Apply updates
  Object.keys(updates).forEach(key => {
    if (key !== 'user' && key !== '_id') {
      if (key in metric) {
        if (key in metric) {
          (metric as any)[key] = updates[key as keyof BodyMetric]!;
        }
      }
    }
  });
  
  await metric.save();
  
  return metric.toObject();
};

/**
 * Delete a metric
 */
export const deleteMetric = async (userId: string, metricId: string): Promise<boolean> => {
  const result = await ProgressMetric.deleteOne({
    _id: metricId,
    user: userId
  });
  
  return result.deletedCount === 1;
};

/**
 * Get personal records for a user
 */
export const getPersonalRecords = async (userId: string): Promise<PersonalRecord[]> => {
  // Get strength training personal records from workouts
  const workouts = await Workout.find({
    user: userId,
    status: 'completed'
  }).lean();
  
  const records: PersonalRecord[] = [];
  
  // Process workout data to find PRs for each exercise
  const exercisePRMap = new Map<string, number>();
  
  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.isPersonalRecord && set.weight && set.reps) {
          const exerciseId = exercise.exercise.toString();
          const volume = set.weight * set.reps;
          
          if (!exercisePRMap.has(exerciseId) || exercisePRMap.get(exerciseId)! < volume) {
            exercisePRMap.set(exerciseId, volume);
            
            records.push({
              type: 'strength',
              exerciseId: exerciseId,
              exerciseName: typeof exercise.exercise === 'string' 
                ? exercise.exercise 
                : exercise.exercise?.toString() || 'Unknown Exercise',
              value: set.weight,
              reps: set.reps,
              volume: volume,
              date: workout.endTime || workout.startTime,
              workoutId: workout._id.toString()
            });
          }
        }
      });
    });
  });
  
  // Get body measurement records
  const bodyMetrics = await ProgressMetric.find({ user: userId }).lean();
  
  // Group metrics by type
  const metricsByType = bodyMetrics.reduce((acc, metric) => {
    if (!acc[metric.type]) {
      acc[metric.type] = [];
    }
    acc[metric.type].push({
      ...metric,
      user: metric.user.toString()
    });
    return acc;
  }, {} as { [key in MetricType]: BodyMetric[] });
  
  // Find min/max records for each metric type
  for (const type in metricsByType) {
    const typeMetrics = metricsByType[type as MetricType];
    
    if (typeMetrics.length > 0) {
      // For weight and body fat, lower is better
      if (type === MetricType.WEIGHT || type === MetricType.BODY_FAT || type === MetricType.WAIST) {
        const min = typeMetrics.reduce((min, metric) => 
          metric.value < min.value ? metric : min, typeMetrics[0]);
        
        records.push({
          type: 'body',
          metricType: type as MetricType,
          value: min.value,
          date: min.date,
          notes: `Lowest ${type.toLowerCase()} recorded`
        });
      } 
      // For muscle measurements, higher is better
      else if (type === MetricType.CHEST || type === MetricType.ARMS || type === MetricType.THIGHS) {
        const max = typeMetrics.reduce((max, metric) => 
          metric.value > max.value ? metric : max, typeMetrics[0]);
        
        records.push({
          type: 'body',
          metricType: type as MetricType,
          value: max.value,
          date: max.date,
          notes: `Highest ${type.toLowerCase()} recorded`
        });
      }
    }
  }
  
  // Sort records by date (most recent first)
  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return records;
};

/**
 * Compare metrics between two periods
 */
export const compareMetricsPeriods = async (
  userId: string,
  period1Start: Date,
  period1End: Date,
  period2Start: Date,
  period2End: Date,
  type?: MetricType
): Promise<MetricComparison> => {
  // Build query base
  const queryBase: any = { user: userId };
  if (type) {
    queryBase.type = type;
  }
  
  // Get metrics for period 1
  const period1Metrics = await ProgressMetric.find({
    ...queryBase,
    date: { $gte: period1Start, $lte: period1End }
  }).lean();
  
  // Get metrics for period 2
  const period2Metrics = await ProgressMetric.find({
    ...queryBase,
    date: { $gte: period2Start, $lte: period2End }
  }).lean();
  
  // Group period 1 metrics by type
  const period1ByType = period1Metrics.reduce((acc, metric) => {
    if (!acc[metric.type]) {
      acc[metric.type] = [];
    }
    acc[metric.type].push({
      ...metric,
      user: metric.user.toString()
    });
    return acc;
  }, {} as { [key in MetricType]: BodyMetric[] });
  
  // Group period 2 metrics by type
  const period2ByType = period2Metrics.reduce((acc, metric) => {
    if (!acc[metric.type]) {
      acc[metric.type] = [];
    }
    acc[metric.type].push({
      ...metric,
      user: metric.user.toString()
    });
    return acc;
  }, {} as { [key in MetricType]: BodyMetric[] });
  
  // Prepare comparison result
  const result: MetricComparison = {
    period1: {
      start: period1Start,
      end: period1End,
      metrics: {
        weight: { count: 0, average: 0, latest: 0, latestDate: new Date(), oldest: 0, oldestDate: new Date(), min: 0, max: 0, change: { value: 0, percent: 0, isPositive: false } },
        body_fat: { count: 0, average: 0, latest: 0, latestDate: new Date(), oldest: 0, oldestDate: new Date(), min: 0, max: 0, change: { value: 0, percent: 0, isPositive: false } },
        chest: { count: 0, average: 0, latest: 0, latestDate: new Date(), oldest: 0, oldestDate: new Date(), min: 0, max: 0, change: { value: 0, percent: 0, isPositive: false } },
        waist: { count: 0, average: 0, latest: 0, latestDate: new Date(), oldest: 0, oldestDate: new Date(), min: 0, max: 0, change: { value: 0, percent: 0, isPositive: false } },
        arms: { count: 0, average: 0, latest: 0, latestDate: new Date(), oldest: 0, oldestDate: new Date(), min: 0, max: 0, change: { value: 0, percent: 0, isPositive: false } },
        thighs: { count: 0, average: 0, latest: 0, latestDate: new Date(), oldest: 0, oldestDate: new Date(), min: 0, max: 0, change: { value: 0, percent: 0, isPositive: false } },
        hips: { count: 0, average: 0, latest: 0, latestDate: new Date(), oldest: 0, oldestDate: new Date(), min: 0, max: 0, change: { value: 0, percent: 0, isPositive: false } }
      }
    },
    period2: {
      start: period2Start,
      end: period2End,
      metrics: {
        weight: { count: 0, average: 0, latest: 0, latestDate: new Date(), oldest: 0, oldestDate: new Date(), min: 0, max: 0, change: { value: 0, percent: 0, isPositive: false } },
        body_fat: { count: 0, average: 0, latest: 0, latestDate: new Date(), oldest: 0, oldestDate: new Date(), min: 0, max: 0, change: { value: 0, percent: 0, isPositive: false } },
        chest: { count: 0, average: 0, latest: 0, latestDate: new Date(), oldest: 0, oldestDate: new Date(), min: 0, max: 0, change: { value: 0, percent: 0, isPositive: false } },
        waist: { count: 0, average: 0, latest: 0, latestDate: new Date(), oldest: 0, oldestDate: new Date(), min: 0, max: 0, change: { value: 0, percent: 0, isPositive: false } },
        arms: { count: 0, average: 0, latest: 0, latestDate: new Date(), oldest: 0, oldestDate: new Date(), min: 0, max: 0, change: { value: 0, percent: 0, isPositive: false } },
        thighs: { count: 0, average: 0, latest: 0, latestDate: new Date(), oldest: 0, oldestDate: new Date(), min: 0, max: 0, change: { value: 0, percent: 0, isPositive: false } },
        hips: { count: 0, average: 0, latest: 0, latestDate: new Date(), oldest: 0, oldestDate: new Date(), min: 0, max: 0, change: { value: 0, percent: 0, isPositive: false } }
      }
    },
    differences: {
      weight: { averageDifference: 0, percentChange: null, isPositive: false },
      body_fat: { averageDifference: 0, percentChange: null, isPositive: false },
      chest: { averageDifference: 0, percentChange: null, isPositive: false },
      waist: { averageDifference: 0, percentChange: null, isPositive: false },
      arms: { averageDifference: 0, percentChange: null, isPositive: false },
      thighs: { averageDifference: 0, percentChange: null, isPositive: false },
      hips: { averageDifference: 0, percentChange: null, isPositive: false }
    }
  };
  
  // Process all metric types present in either period
  const allTypes = new Set([
    ...Object.keys(period1ByType),
    ...Object.keys(period2ByType)
  ]);
  
  allTypes.forEach((metricType) => {
    const type = metricType as MetricType;
    const p1Metrics = period1ByType[type] || [];
    const p2Metrics = period2ByType[type] || [];
    
    // Calculate average for period 1
    const p1Values = p1Metrics.map(m => m.value);
    const p1Avg = p1Values.length > 0 
      ? p1Values.reduce((sum, val) => sum + val, 0) / p1Values.length
      : null;
    
    // Calculate average for period 2
    const p2Values = p2Metrics.map(m => m.value);
    const p2Avg = p2Values.length > 0 
      ? p2Values.reduce((sum, val) => sum + val, 0) / p2Values.length
      : null;
    
    // Get first and last for each period
    const p1First = p1Metrics.length > 0 
      ? p1Metrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].value
      : null;
      
    const p1Last = p1Metrics.length > 0 
      ? p1Metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].value
      : null;
      
    const p2First = p2Metrics.length > 0 
      ? p2Metrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].value
      : null;
      
    const p2Last = p2Metrics.length > 0 
      ? p2Metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].value
      : null;
    
    // Store results
    result.period1.metrics[type] = {
      count: p1Metrics.length,
      average: p1Avg ?? 0,
      oldest: p1First ?? 0,
      oldestDate: p1Metrics.length > 0 ? p1Metrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date : new Date(),
      latest: p1Last ?? 0,
      latestDate: p1Metrics.length > 0 ? p1Metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : new Date(),
      min: p1Values.length > 0 ? Math.min(...p1Values) : 0,
      max: p1Values.length > 0 ? Math.max(...p1Values) : 0,
      change: p1First !== null && p1Last !== null 
        ? { value: p1Last - p1First, percent: p1First !== 0 ? ((p1Last - p1First) / p1First) * 100 : 0, isPositive: (p1Last - p1First) > 0 }
        : { value: 0, percent: 0, isPositive: false }
    };
    
    result.period2.metrics[type] = {
      count: p2Metrics.length,
      average: p2Avg ?? 0,
      oldest: p2First ?? 0,
      oldestDate: p2Metrics.length > 0 ? p2Metrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date : new Date(),
      latest: p2Last ?? 0,
      latestDate: p2Metrics.length > 0 ? p2Metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : new Date(),
      min: p2Values.length > 0 ? Math.min(...p2Values) : 0,
      max: p2Values.length > 0 ? Math.max(...p2Values) : 0,
      change: p2First !== null && p2Last !== null 
        ? { value: p2Last - p2First, percent: p2First !== 0 ? ((p2Last - p2First) / p2First) * 100 : 0, isPositive: (p2Last - p2First) > 0 }
        : { value: 0, percent: 0, isPositive: false }
    };
    
    // Calculate differences
    if (p1Avg !== null && p2Avg !== null) {
      const avgDiff = p2Avg - p1Avg;
      const avgDiffPercent = p1Avg !== 0 ? (avgDiff / p1Avg) * 100 : null;
      
      result.differences[type] = {
        averageDifference: avgDiff,
        percentChange: avgDiffPercent,
        isPositive: isChangePositive(type, avgDiff)
      };
    }
  });
  
  return result;
};

/**
 * Helper function to determine if a change is positive based on metric type
 */
function isChangePositive(type: MetricType, change: number): boolean {
  // For weight, body fat, and waist, a decrease is positive
  if (
    type === MetricType.WEIGHT || 
    type === MetricType.BODY_FAT || 
    type === MetricType.WAIST
  ) {
    return change < 0;
  }
  
  // For muscle measurements, an increase is positive
  if (
    type === MetricType.CHEST || 
    type === MetricType.ARMS || 
    type === MetricType.THIGHS
  ) {
    return change > 0;
  }
  
  // For other measurements, default to increase is positive
  return change > 0;
}