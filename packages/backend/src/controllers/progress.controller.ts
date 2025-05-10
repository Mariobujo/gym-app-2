import { Request, Response } from 'express';
import { AppError } from '../utils/errors';
import * as progressService from '../services/progress.service';
import { MetricType } from '../types/progress.types';
import { formatDate } from '../utils/date';

/**
 * Get all metrics for the current user
 */
export const getAllMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const metrics = await progressService.getUserMetrics(userId);
    
    res.status(200).json({
      status: 'success',
      results: metrics.length,
      data: { metrics }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new AppError(`Failed to fetch metrics: ${errorMessage}`, 400);
  }
};

/**
 * Get metrics by type for the current user
 */
export const getMetricsByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const type = req.params.type as MetricType;
    
    // Validate metric type
    if (!Object.values(MetricType).includes(type)) {
      throw new AppError(`Invalid metric type: ${type}`, 400);
    }
    
    const metrics = await progressService.getMetricsByType(userId, type);
    
    res.status(200).json({
      status: 'success',
      results: metrics.length,
      data: { metrics }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new AppError(`Failed to fetch metrics by type: ${errorMessage}`, 400);
  }
};

/**
 * Get metrics by date range for the current user
 */
export const getMetricsByDateRange = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, type } = req.query;
    
    // Convert string dates to Date objects
    const start = startDate ? new Date(startDate as string) : new Date(0); // Default to epoch start
    const end = endDate ? new Date(endDate as string) : new Date(); // Default to now
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError('Invalid date format. Please use ISO format (YYYY-MM-DD)', 400);
    }
    
    const metrics = await progressService.getMetricsByDateRange(
      userId,
      start,
      end,
      type as MetricType
    );
    
    res.status(200).json({
      status: 'success',
      results: metrics.length,
      data: { 
        metrics,
        range: {
          startDate: formatDate(start),
          endDate: formatDate(end)
        }
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new AppError(`Failed to fetch metrics by date range: ${errorMessage}`, 400);
  }
};

/**
 * Get summary of metrics for the current user
 */
export const getMetricsSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const summary = await progressService.getMetricsSummary(userId);
    
    res.status(200).json({
      status: 'success',
      data: { summary }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new AppError(`Failed to fetch metrics summary: ${errorMessage}`, 400);
  }
};

/**
 * Add a new metric for the current user
 */
export const addMetric = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { type, value, date, notes } = req.body;
    
    const newMetric = await progressService.addMetric(userId, {
      type,
      value,
      date: date ? new Date(date) : new Date(),
      notes
    });
    
    res.status(201).json({
      status: 'success',
      data: { metric: newMetric }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new AppError(`Failed to add metric: ${errorMessage}`, 400);
  }
};

/**
 * Update an existing metric
 */
export const updateMetric = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const metricId = req.params.id;
    const updates = req.body;
    
    const updatedMetric = await progressService.updateMetric(userId, metricId, updates);
    
    if (!updatedMetric) {
      throw new AppError('Metric not found or you do not have permission to update it', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: { metric: updatedMetric }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new AppError(`Failed to update metric: ${errorMessage}`, 400);
  }
};

/**
 * Delete a metric
 */
export const deleteMetric = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const metricId = req.params.id;
    
    const deleted = await progressService.deleteMetric(userId, metricId);
    
    if (!deleted) {
      throw new AppError('Metric not found or you do not have permission to delete it', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new AppError(`Failed to delete metric: ${errorMessage}`, 400);
  }
};

/**
 * Get personal records for the current user
 */
export const getPersonalRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const records = await progressService.getPersonalRecords(userId);
    
    res.status(200).json({
      status: 'success',
      data: { records }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new AppError(`Failed to fetch personal records: ${errorMessage}`, 400);
  }
};

/**
 * Compare metrics between two periods
 */
export const compareMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { 
      period1Start, 
      period1End, 
      period2Start, 
      period2End, 
      type 
    } = req.query;
    
    // Parse dates
    const p1Start = new Date(period1Start as string);
    const p1End = new Date(period1End as string);
    const p2Start = new Date(period2Start as string);
    const p2End = new Date(period2End as string);
    
    // Validate dates
    if ([p1Start, p1End, p2Start, p2End].some(d => isNaN(d.getTime()))) {
      throw new AppError('Invalid date format. Please use ISO format (YYYY-MM-DD)', 400);
    }
    
    const comparison = await progressService.compareMetricsPeriods(
      userId,
      p1Start,
      p1End,
      p2Start,
      p2End,
      type as MetricType
    );
    
    res.status(200).json({
      status: 'success',
      data: { comparison }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new AppError(`Failed to compare metrics: ${errorMessage}`, 400);
  }
};