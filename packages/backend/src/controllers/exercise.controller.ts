// src/controllers/exercise.controller.ts

import { Request, Response, NextFunction } from 'express';
import { exerciseService } from '../services/exercise.service';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError } from '../utils/errors';
import { MuscleGroup, ExerciseEquipment } from '../types/enums';

export class ExerciseController {
  /**
   * Get all exercises with filtering
   * @route GET /api/exercises
   */
  getExercises = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const {
      type,
      muscleGroups,
      equipment,
      difficultyLevel,
      level,
      weightType,
      page,
      limit,
      sort
    } = req.query;
    
    // Parse pagination options
    const paginationOptions = {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sort: sort as string
    };
    
    // Parse difficulty level if provided
    let parsedDifficultyLevel;
    if (difficultyLevel) {
      parsedDifficultyLevel = parseInt(difficultyLevel as string, 10);
      if (isNaN(parsedDifficultyLevel) || parsedDifficultyLevel < 1 || parsedDifficultyLevel > 5) {
        throw new BadRequestError('Difficulty level must be between 1 and 5');
      }
    }
    
    const filters = {
      type: type as string,
      muscleGroups: muscleGroups as string | string[],
      equipment: equipment as string | string[],
      difficultyLevel: parsedDifficultyLevel,
      level: level as string,
      weightType: weightType as string
    };
    
    const result = await exerciseService.getExercises(filters, paginationOptions);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  });
  
  /**
   * Get a single exercise by ID
   * @route GET /api/exercises/:id
   */
  getExerciseById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    
    const exercise = await exerciseService.getExerciseById(id);
    
    // If authenticated, check if user has favorited this exercise
    let isFavorite = false;
    if (req.user) {
      isFavorite = await exerciseService.isExerciseFavorited(id, req.user.id);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        exercise,
        isFavorite
      }
    });
  });
  
  /**
   * Create a new exercise
   * @route POST /api/exercises
   */
  createExercise = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const exercise = await exerciseService.createExercise(
      req.body,
      req.user.id,
      req.user.role
    );
    
    res.status(201).json({
      status: 'success',
      data: {
        exercise
      }
    });
  });
  
  /**
   * Update an exercise
   * @route PUT /api/exercises/:id
   */
  updateExercise = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    
    const exercise = await exerciseService.updateExercise(
      id,
      req.body,
      req.user.id,
      req.user.role
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        exercise
      }
    });
  });
  
  /**
   * Delete an exercise
   * @route DELETE /api/exercises/:id
   */
  deleteExercise = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    
    await exerciseService.deleteExercise(
      id,
      req.user.id,
      req.user.role
    );
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  });
  
  /**
   * Search exercises by text
   * @route GET /api/exercises/search
   */
  searchExercises = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { q, page, limit } = req.query;
    
    if (!q) {
      throw new BadRequestError('Search query is required');
    }
    
    const paginationOptions = {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined
    };
    
    const result = await exerciseService.searchExercises(
      q as string,
      paginationOptions
    );
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  });
  
  /**
   * Get exercises by muscle group
   * @route GET /api/exercises/muscle-groups/:group
   */
  getExercisesByMuscleGroup = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { group } = req.params;
    const { page, limit, sort } = req.query;
    
    // Validate muscle group
    if (!Object.values(MuscleGroup).includes(group as MuscleGroup)) {
      throw new BadRequestError('Invalid muscle group');
    }
    
    const paginationOptions = {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sort: sort as string
    };
    
    const result = await exerciseService.getExercisesByMuscleGroup(
      group as MuscleGroup,
      paginationOptions
    );
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  });
  
  /**
   * Get exercises by equipment
   * @route GET /api/exercises/equipment/:type
   */
  getExercisesByEquipment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { type } = req.params;
    const { page, limit, sort } = req.query;
    
    // Validate equipment type
    if (!Object.values(ExerciseEquipment).includes(type as ExerciseEquipment)) {
      throw new BadRequestError('Invalid equipment type');
    }
    
    const paginationOptions = {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sort: sort as string
    };
    
    const result = await exerciseService.getExercisesByEquipment(
      type as ExerciseEquipment,
      paginationOptions
    );
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  });
  
  /**
   * Toggle exercise as favorite
   * @route POST /api/exercises/:id/favorite
   */
  toggleFavorite = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    
    const result = await exerciseService.toggleFavorite(
      id,
      req.user.id
    );
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  });
  
  /**
   * Get user's favorite exercises
   * @route GET /api/exercises/favorites
   */
  getFavoriteExercises = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { page, limit, sort } = req.query;
    
    const paginationOptions = {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sort: sort as string
    };
    
    const result = await exerciseService.getFavoriteExercises(
      req.user.id,
      paginationOptions
    );
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  });
}

export const exerciseController = new ExerciseController();