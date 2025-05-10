import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import * as progressController from '../controllers/progress.controller';
import { progressValidation } from '../validations/progress.validation';

const router = Router();

// Apply authentication middleware to all progress routes
router.use(authMiddleware);

// Get all metrics (for current user)
router.get(
  '/',
  cacheMiddleware(600), // Cache for 10 minutes
  progressController.getAllMetrics
);

// Get metrics by type
router.get(
  '/type/:type',
  cacheMiddleware(300), // Cache for 5 minutes
  progressController.getMetricsByType
);

// Get metrics by date range
router.get(
  '/range',
  validateRequest(progressValidation.dateRangeSchema, 'query'),
  progressController.getMetricsByDateRange
);

// Get summary of all metrics
router.get(
  '/summary',
  cacheMiddleware(1800), // Cache for 30 minutes
  progressController.getMetricsSummary
);

// Add a new metric
router.post(
  '/',
  validateRequest(progressValidation.addMetricSchema, 'body'),
  async (req, res, next) => {
    try {
      await progressController.addMetric(req, res);
      // Invalidate relevant caches when a new metric is added
      await invalidateCache('/progress/*');
    } catch (error) {
      next(error);
    }
  }
);

// Update a metric
router.put(
  '/:id',
  validateRequest(progressValidation.updateMetricSchema, 'body'),
  async (req, res, next) => {
    try {
      await progressController.updateMetric(req, res);
      // Invalidate relevant caches when a metric is updated
      await invalidateCache('/progress/*');
    } catch (error) {
      next(error);
    }
  }
);

// Delete a metric
router.delete(
  '/:id',
  async (req, res, next) => {
    try {
      await progressController.deleteMetric(req, res);
      // Invalidate relevant caches when a metric is deleted
      await invalidateCache('/progress/*');
    } catch (error) {
      next(error);
    }
  }
);

// Get personal records
router.get(
  '/records',
  cacheMiddleware(1800), // Cache for 30 minutes
  progressController.getPersonalRecords
);

// Metrics comparison (e.g., this month vs last month)
router.get(
  '/compare',
  validateRequest(progressValidation.compareMetricsSchema, 'query'),
  progressController.compareMetrics
);

// Export the router
export default router;