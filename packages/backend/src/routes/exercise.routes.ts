// src/routes/exercise.routes.ts

import { Router } from 'express';
import { exerciseController } from '../controllers/exercise.controller';
import { authMiddleware, restrictTo } from '../middleware/auth.middleware';
import { UserRole } from '../types/user.types';
import cache from '../middleware/cache.middleware';
import { validate, schemas } from '../middleware/validate.middleware';

const router = Router();

// Public routes (some with caching)
router.get('/', validate(schemas.pagination, 'query'), cache.cacheMiddleware(300), exerciseController.getExercises);
router.get('/search', validate(schemas.pagination, 'query'), exerciseController.searchExercises);
router.get('/muscle-groups/:group', validate(schemas.pagination, 'query'), cache.cacheMiddleware(3600), exerciseController.getExercisesByMuscleGroup);
router.get('/equipment/:type', validate(schemas.pagination, 'query'), cache.cacheMiddleware(3600), exerciseController.getExercisesByEquipment);
router.get('/:id', validate(schemas.id, 'params'), cache.cacheMiddleware(300), exerciseController.getExerciseById);

// Protected routes
router.use(authMiddleware);

// Routes that require authentication but not admin privileges
router.post('/:id/favorite', validate(schemas.id, 'params'), exerciseController.toggleFavorite);
router.get('/favorites', validate(schemas.pagination, 'query'), exerciseController.getFavoriteExercises);

// Routes that require admin privileges
router.post('/', 

  restrictTo([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validate(schemas.exercise.create), 
  exerciseController.createExercise
);
router.put('/:id', 
  validate(schemas.id, 'params'),
  validate(schemas.exercise.update),
  exerciseController.updateExercise
);
router.delete('/:id', 
  validate(schemas.id, 'params'),
  exerciseController.deleteExercise
);

export default router;