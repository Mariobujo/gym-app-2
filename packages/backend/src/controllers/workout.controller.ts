// src/controllers/workout.controller.ts

import { Request, Response, NextFunction } from 'express';
import workoutService from '../services/workout.service';
import { catchAsync } from '../utils/catchAsync';

export class WorkoutController {
  /**
   * Crear un nuevo entrenamiento
   * POST /api/workouts
   */
  createWorkout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const workoutData = { ...req.body, user: userId };
    
    const workout = await workoutService.createWorkout(workoutData);
    
    res.status(201).json({
      status: 'success',
      data: {
        workout
      }
    });
  });

  /**
   * Obtener un entrenamiento por ID
   * GET /api/workouts/:id
   */
  getWorkout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const workout = await workoutService.getWorkoutById(id, userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        workout
      }
    });
  });

  /**
   * Obtener entrenamientos de un usuario
   * GET /api/workouts
   */
  getUserWorkouts = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const { limit, offset, status, fromDate, toDate, routineId } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      status: status as string,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      routineId: routineId as string
    };
    
    const { workouts, total } = await workoutService.getUserWorkouts(userId, options);
    
    res.status(200).json({
      status: 'success',
      results: workouts.length,
      total,
      data: {
        workouts
      }
    });
  });

  /**
   * Actualizar un entrenamiento
   * PATCH /api/workouts/:id
   */
  updateWorkout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const workout = await workoutService.updateWorkout(id, userId, req.body);
    
    res.status(200).json({
      status: 'success',
      data: {
        workout
      }
    });
  });

  /**
   * Añadir un ejercicio a un entrenamiento
   * POST /api/workouts/:id/exercises
   */
  addExerciseToWorkout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const workout = await workoutService.addExerciseToWorkout(id, userId, req.body);
    
    res.status(200).json({
      status: 'success',
      data: {
        workout
      }
    });
  });

  /**
   * Actualizar un ejercicio en un entrenamiento
   * PATCH /api/workouts/:id/exercises/:exerciseId
   */
  updateExerciseInWorkout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id, exerciseId } = req.params;
    const userId = req.user.id;
    
    const workout = await workoutService.updateExerciseInWorkout(id, userId, exerciseId, req.body);
    
    res.status(200).json({
      status: 'success',
      data: {
        workout
      }
    });
  });

  /**
   * Completar un entrenamiento
   * PATCH /api/workouts/:id/complete
   */
  completeWorkout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const workout = await workoutService.completeWorkout(id, userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        workout
      }
    });
  });

  /**
   * Eliminar un entrenamiento
   * DELETE /api/workouts/:id
   */
  deleteWorkout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    await workoutService.deleteWorkout(id, userId);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  });

  /**
   * Obtener estadísticas de entrenamientos
   * GET /api/workouts/stats
   */
  getWorkoutStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const { period } = req.query;
    
    const stats = await workoutService.getWorkoutStats(
      userId, 
      (period as 'week' | 'month' | 'year') || 'month'
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  });
}

export default new WorkoutController();