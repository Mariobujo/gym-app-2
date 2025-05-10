// src/routes/workout.routes.ts

import { Router } from 'express';
import workoutController from '../controllers/workout.controller';
import authenticate from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import cache from '../middleware/cache.middleware';
import { workoutValidation } from '../validations/workout.validation';

const router = Router();

// Proteger todas las rutas de workout
router.use(authenticate);

// Rutas para entrenamientos
router.route('/')
  .post(validate(workoutValidation.createWorkout), workoutController.createWorkout)
  .get(workoutController.getUserWorkouts);

// Estadísticas de entrenamientos
router.get('/stats', workoutController.getWorkoutStats);

// Rutas para un entrenamiento específico
router.route('/:id')
  .get(workoutController.getWorkout)
  .patch(validate(workoutValidation.updateWorkout), workoutController.updateWorkout)
  .delete(workoutController.deleteWorkout);

// Completar un entrenamiento
router.patch('/:id/complete', workoutController.completeWorkout);

// Gestión de ejercicios dentro de un entrenamiento
router.post(
  '/:id/exercises',
  validate(workoutValidation.addExercise),
  workoutController.addExerciseToWorkout
);

router.patch(
  '/:id/exercises/:exerciseId',
  validate(workoutValidation.updateExercise),
  workoutController.updateExerciseInWorkout
);

export default router;