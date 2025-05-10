// src/controllers/routine.controller.ts

import { Request, Response, NextFunction } from 'express';
import { routineService } from '../services/routine.service';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError } from '../utils/errors';

export class RoutineController {
  /**
   * Get all routines with filtering
   * @route GET /api/routines
   */
  getRoutines = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const {
      objective,
      level,
      equipment,
      muscleGroups,
      difficulty,
      search,
      creator,
      visibility,
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

    // Parse filters
    const filters = {
      objective: objective as string,
      level: level as string,
      equipment: equipment as string | string[],
      muscleGroups: muscleGroups as string | string[],
      difficulty: difficulty ? parseInt(difficulty as string, 10) : undefined,
      search: search as string,
      creator: creator as string,
      visibility: visibility as string
    };

    // Get user ID if authenticated
    const userId = req.user ? req.user.id : null;

    const result = await routineService.getRoutines(userId, filters, paginationOptions);

    res.status(200).json({
      status: 'success',
      data: result
    });
  });

  /**
   * Get user's routines
   * @route GET /api/routines/my
   */
  getUserRoutines = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { page, limit, sort } = req.query;

    // Parse pagination options
    const paginationOptions = {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sort: sort as string
    };

    const userId = req.user.id;

    const result = await routineService.getUserRoutines(userId, paginationOptions);

    res.status(200).json({
      status: 'success',
      data: result
    });
  });

  /**
   * Get routine templates
   * @route GET /api/routines/templates
   */
  getRoutineTemplates = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { page, limit, sort } = req.query;

    // Parse pagination options
    const paginationOptions = {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sort: sort as string
    };

    const result = await routineService.getRoutineTemplates(paginationOptions);

    res.status(200).json({
      status: 'success',
      data: result
    });
  });

  /**
   * Get a specific routine by ID
   * @route GET /api/routines/:id
   */
  getRoutineById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user ? req.user.id : undefined;

    const routine = await routineService.getRoutineById(id, userId);

    res.status(200).json({
      status: 'success',
      data: {
        routine
      }
    });
  });

  /**
   * Create a new routine
   * @route POST /api/routines
   */
  createRoutine = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;

    const routine = await routineService.createRoutine(req.body, userId);

    res.status(201).json({
      status: 'success',
      data: {
        routine
      }
    });
  });

  /**
   * Update a routine
   * @route PUT /api/routines/:id
   */
  updateRoutine = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const routine = await routineService.updateRoutine(id, req.body, userId, userRole);

    res.status(200).json({
      status: 'success',
      data: {
        routine
      }
    });
  });

  /**
   * Delete a routine
   * @route DELETE /api/routines/:id
   */
  deleteRoutine = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    await routineService.deleteRoutine(id, userId, userRole);

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

  /**
   * Copy a routine
   * @route POST /api/routines/copy/:id
   */
  copyRoutine = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description } = req.body;

    const routine = await routineService.copyRoutine(id, userId, { name, description });

    res.status(201).json({
      status: 'success',
      data: {
        routine
      }
    });
  });

  /**
   * Toggle routine visibility
   * @route PUT /api/routines/:id/publish
   */
  toggleRoutineVisibility = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { visibility } = req.body;

    if (!visibility || !['public', 'private', 'friends'].includes(visibility)) {
      throw new BadRequestError('Invalid visibility setting');
    }

    const routine = await routineService.toggleRoutineVisibility(
      id,
      userId,
      visibility as 'public' | 'private' | 'friends'
    );

    res.status(200).json({
      status: 'success',
      data: {
        routine
      }
    });
  });

  /**
   * Rate a routine
   * @route POST /api/routines/:id/rate
   */
  rateRoutine = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { rating, review } = req.body;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      throw new BadRequestError('Rating must be a number between 1 and 5');
    }

    const routine = await routineService.rateRoutine(id, userId, rating, review);

    res.status(200).json({
      status: 'success',
      data: {
        routine
      }
    });
  });

  /**
   * Get routines by objective
   * @route GET /api/routines/by-objective/:objective
   */
  getRoutinesByObjective = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { objective } = req.params;
    const { page, limit, sort } = req.query;

    // Parse pagination options
    const paginationOptions = {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sort: sort as string
    };

    const result = await routineService.getRoutinesByObjective(objective, paginationOptions);

    res.status(200).json({
      status: 'success',
      data: result
    });
  });

  /**
   * Get routines by user
   * @route GET /api/routines/by-user/:userId
   */
  getRoutinesByUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const { page, limit, sort } = req.query;

    // Parse pagination options
    const paginationOptions = {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sort: sort as string
    };

    const result = await routineService.getRoutinesByUser(userId, paginationOptions);

    res.status(200).json({
      status: 'success',
      data: result
    });
  });
}

export const routineController = new RoutineController();