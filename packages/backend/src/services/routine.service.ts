// src/services/routine.service.ts

import mongoose from 'mongoose';
import Routine, { IRoutine } from '../models/routine.model';
import Exercise from '../models/exercise.model';
import Rating from '../models/rating.model';
import User from '../models/user.model';
import { NotFoundError, BadRequestError, forbiddenError } from '../utils/errors';
import { UserRole, MuscleGroup, ExerciseEquipment } from '../types/enums';
import { invalidateCache } from '../middleware/cache.middleware';

export interface RoutineFilters {
  objective?: string;
  level?: string;
  equipment?: string | string[];
  muscleGroups?: string | string[];
  difficulty?: number;
  search?: string;
  creator?: string;
  visibility?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
}

export class RoutineService {
  /**
   * Get all routines with filtering and pagination
   */
  async getRoutines(
    userId: string | null,
    filters: RoutineFilters = {},
    paginationOptions: PaginationOptions = {}
  ): Promise<{ routines: IRoutine[], total: number, page: number, limit: number, totalPages: number }> {
    const {
      page = 1,
      limit = 20,
      sort = '-metadata.rating'
    } = paginationOptions;

    const skip = (page - 1) * limit;

    // Build query based on filters
    const query: any = {};

    // If not admin, only show public routines or user's private routines
    if (userId) {
      query.$or = [
        { 'metadata.visibility': 'public' },
        { 'creator.id': userId }
      ];
    } else {
      query['metadata.visibility'] = 'public';
    }

    if (filters.objective) {
      query.objective = filters.objective;
    }

    if (filters.level) {
      query.level = filters.level;
    }

    if (filters.equipment) {
      const equipmentArray = Array.isArray(filters.equipment)
        ? filters.equipment
        : [filters.equipment];

      query.equipment = { $in: equipmentArray };
    }

    if (filters.muscleGroups) {
      const muscleGroupArray = Array.isArray(filters.muscleGroups)
        ? filters.muscleGroups
        : [filters.muscleGroups];

      query['muscleGroups.primary'] = { $in: muscleGroupArray };
    }

    if (filters.difficulty) {
      query['metadata.difficulty'] = filters.difficulty;
    }

    if (filters.creator) {
      query['creator.id'] = filters.creator;
    }

    if (filters.visibility && userId) {
      // Only apply visibility filter to user's own routines
      query.$or = [
        { 'metadata.visibility': 'public' },
        { 'creator.id': userId, 'metadata.visibility': filters.visibility }
      ];
    }

    // Text search if provided
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // Execute query
    const routines = await Routine.find(query)
      .populate({
        path: 'exercises.exerciseId',
        select: 'name media.thumbnailUrl'
      })
      .populate({
        path: 'creator.id',
        select: 'firstName lastName profile.displayName profile.avatar'
      })
      .sort(filters.search ? { score: { $meta: 'textScore' } } : sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Routine.countDocuments(query);

    return {
      routines,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get user's routines
   */
  async getUserRoutines(
    userId: string,
    paginationOptions: PaginationOptions = {}
  ): Promise<{ routines: IRoutine[], total: number, page: number, limit: number, totalPages: number }> {
    const {
      page = 1,
      limit = 20,
      sort = '-metadata.updatedAt'
    } = paginationOptions;

    const skip = (page - 1) * limit;

    // Build query for user's routines
    const query = {
      'creator.id': userId
    };

    // Execute query
    const routines = await Routine.find(query)
      .populate({
        path: 'exercises.exerciseId',
        select: 'name media.thumbnailUrl'
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Routine.countDocuments(query);

    return {
      routines,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get routine templates (system-created routines)
   */
  async getRoutineTemplates(
    paginationOptions: PaginationOptions = {}
  ): Promise<{ routines: IRoutine[], total: number, page: number, limit: number, totalPages: number }> {
    const {
      page = 1,
      limit = 20,
      sort = '-metadata.rating'
    } = paginationOptions;

    const skip = (page - 1) * limit;

    // Build query for system templates
    const query = {
      'creator.type': 'system',
      'metadata.visibility': 'public'
    };

    // Execute query
    const routines = await Routine.find(query)
      .populate({
        path: 'exercises.exerciseId',
        select: 'name media.thumbnailUrl'
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Routine.countDocuments(query);

    return {
      routines,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get a specific routine by ID
   */
  async getRoutineById(
    routineId: string,
    userId?: string
  ): Promise<IRoutine> {
    if (!mongoose.Types.ObjectId.isValid(routineId)) {
      throw new BadRequestError('Invalid routine ID');
    }

    const routine = await Routine.findById(routineId)
      .populate({
        path: 'exercises.exerciseId',
        select: 'name description type equipment muscleGroups media'
      })
      .populate({
        path: 'creator.id',
        select: 'firstName lastName profile.displayName profile.avatar'
      })
      .populate({
        path: 'warmup.exerciseId',
        select: 'name media.thumbnailUrl'
      })
      .populate({
        path: 'cooldown.exerciseId',
        select: 'name media.thumbnailUrl'
      })
      .lean();

    if (!routine) {
      throw new NotFoundError('Routine not found');
    }

    // Check if user has access to this routine
    if (routine.metadata.visibility !== 'public') {
      if (!userId || (userId !== routine.creator.id?.toString() && routine.creator.type !== 'system')) {
        throw forbiddenError('You do not have permission to view this routine');
      }
    }

    // Increment view count for public routines
    if (routine.metadata.visibility === 'public') {
      await Routine.findByIdAndUpdate(routineId, {
        $inc: { 'metadata.popularity': 1 }
      });
    }

    // Get user's rating if authenticated
    let userRating = null;
    if (userId) {
      userRating = await Rating.findOne({
        user: userId,
        routine: routineId
      }).lean();
    }

    return {
      ...routine,
      userRating: userRating ? userRating.rating : null
    } as IRoutine;
  }

  /**
   * Create a new routine
   */
  async createRoutine(
    routineData: Partial<IRoutine>,
    userId: string
  ): Promise<IRoutine> {
    // Validate exercises
    if (routineData.exercises && routineData.exercises.length > 0) {
      for (const exercise of routineData.exercises) {
        if (!mongoose.Types.ObjectId.isValid(exercise.exerciseId.toString())) {
          throw new BadRequestError(`Invalid exercise ID: ${exercise.exerciseId}`);
        }

        const exerciseExists = await Exercise.exists({ _id: exercise.exerciseId });
        if (!exerciseExists) {
          throw new BadRequestError(`Exercise not found with ID: ${exercise.exerciseId}`);
        }
      }
    } else {
      throw new BadRequestError('Routine must have at least one exercise');
    }

    // Calculate total rest time
    let totalRest = 0;
    routineData.exercises?.forEach(exercise => {
      exercise.sets.forEach(set => {
        totalRest += set.rest || 0;
      });
    });

    // Create the routine
    const routine = new Routine({
      ...routineData,
      creator: {
        type: 'user',
        id: userId
      },
      duration: {
        ...routineData.duration,
        rest: totalRest
      },
      metadata: {
        ...routineData.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    await routine.save();

    // Populate exercise details for the response
    const populatedRoutine = await Routine.findById(routine._id)
      .populate({
        path: 'exercises.exerciseId',
        select: 'name description type equipment muscleGroups media'
      });

    // Update user's routine count
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.routinesCreated': 1 }
    });

    return populatedRoutine as IRoutine;
  }

  /**
   * Update an existing routine
   */
  async updateRoutine(
    routineId: string,
    routineData: Partial<IRoutine>,
    userId: string,
    userRole: string
  ): Promise<IRoutine> {
    if (!mongoose.Types.ObjectId.isValid(routineId)) {
      throw new BadRequestError('Invalid routine ID');
    }

    // Find the routine
    const routine = await Routine.findById(routineId);

    if (!routine) {
      throw new NotFoundError('Routine not found');
    }

    // Check permissions
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    const isOwner = routine.creator.type === 'user' && routine.creator.id?.toString() === userId;

    if (!isAdmin && !isOwner) {
      throw forbiddenError('You do not have permission to update this routine');
    }

    // Validate exercises if provided
    if (routineData.exercises && routineData.exercises.length > 0) {
      for (const exercise of routineData.exercises) {
        if (!mongoose.Types.ObjectId.isValid(exercise.exerciseId.toString())) {
          throw new BadRequestError(`Invalid exercise ID: ${exercise.exerciseId}`);
        }

        const exerciseExists = await Exercise.exists({ _id: exercise.exerciseId });
        if (!exerciseExists) {
          throw new BadRequestError(`Exercise not found with ID: ${exercise.exerciseId}`);
        }
      }
    }

    // Calculate total rest time if exercises are updated
    if (routineData.exercises) {
      let totalRest = 0;
      routineData.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          totalRest += set.rest || 0;
        });
      });

      // Update the rest time
      routineData.duration = {
        ...routineData.duration,
        estimated: routineData.duration?.estimated || 0, // Proporciona un valor por defecto
        rest: totalRest
      };
    }

    // Update metadata
    routineData.metadata = {
      ...routineData.metadata,
      updatedAt: new Date(),
      // Agrega valores predeterminados para todas las propiedades requeridas
      estimatedCalories: routineData.metadata?.estimatedCalories || 0,
      difficulty: routineData.metadata?.difficulty || 1,
      tags: routineData.metadata?.tags || [],
      visibility: routineData.metadata?.visibility || 'private',
      featured: routineData.metadata?.featured || false,
      rating: routineData.metadata?.rating || 0,
      ratingCount: routineData.metadata?.ratingCount || 0,
      usedCount: routineData.metadata?.usedCount || 0,
      createdAt: routineData.metadata?.createdAt || new Date()
    };

    // Update the routine
    const updatedRoutine = await Routine.findByIdAndUpdate(
      routineId,
      { $set: routineData },
      { new: true, runValidators: true }
    ).populate({
      path: 'exercises.exerciseId',
      select: 'name description type equipment muscleGroups media'
    });

    // Invalidate cache
    await invalidateCache(`/routines/${routineId}`);

    return updatedRoutine as IRoutine;
  }

  /**
   * Delete a routine
   */
  async deleteRoutine(
    routineId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(routineId)) {
      throw new BadRequestError('Invalid routine ID');
    }

    // Find the routine
    const routine = await Routine.findById(routineId);

    if (!routine) {
      throw new NotFoundError('Routine not found');
    }

    // Check permissions
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    const isOwner = routine.creator.type === 'user' && routine.creator.id?.toString() === userId;

    if (!isAdmin && !isOwner) {
      throw forbiddenError('You do not have permission to delete this routine');
    }

    // Delete related ratings
    await Rating.deleteMany({ routine: routineId });

    // Delete the routine
    await Routine.findByIdAndDelete(routineId);

    // Invalidate cache
    await invalidateCache(`/routines`);
    await invalidateCache(`/routines/${routineId}`);

    // Update user's routine count if it's user-created
    if (routine.creator.type === 'user') {
      await User.findByIdAndUpdate(routine.creator.id, {
        $inc: { 'stats.routinesCreated': -1 }
      });
    }
  }

  /**
   * Copy an existing routine to user's collection
   */
  async copyRoutine(
    routineId: string,
    userId: string,
    customizations: { name?: string, description?: string } = {}
  ): Promise<IRoutine> {
    if (!mongoose.Types.ObjectId.isValid(routineId)) {
      throw new BadRequestError('Invalid routine ID');
    }

    // Find the routine to copy
    const sourceroutine = await Routine.findById(routineId)
      .populate({
        path: 'exercises.exerciseId',
        select: 'name'
      });

    if (!sourceroutine) {
      throw new NotFoundError('Routine not found');
    }

    // Check if user has access to copy this routine
    if (sourceroutine.metadata.visibility !== 'public' && 
        sourceroutine.creator.type !== 'system' && 
        sourceroutine.creator.id?.toString() !== userId) {
      throw forbiddenError('You do not have permission to copy this routine');
    }

    // Create a new routine based on the source
    const routineObj = sourceroutine.toObject();
    delete routineObj._id;
    
    const newRoutine = new Routine({
      ...routineObj,
      name: customizations.name || `Copy of ${sourceroutine.name}`,
      description: customizations.description || sourceroutine.description,
      creator: {
        type: 'user',
        id: userId
      },
      metadata: {
        ...routineObj.metadata,
        visibility: 'private',
        featured: false,
        rating: 0,
        ratingCount: 0,
        usedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    await newRoutine.save();

    // Increment original routine's copy count
    await Routine.findByIdAndUpdate(routineId, {
      $inc: { 'metadata.copyCount': 1 }
    });

    // Update user's routine count
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.routinesCreated': 1 }
    });

    return newRoutine;
  }

  /**
   * Toggle routine visibility (public/private)
   */
  async toggleRoutineVisibility(
    routineId: string,
    userId: string,
    visibility: 'public' | 'private' | 'friends'
  ): Promise<IRoutine> {
    if (!mongoose.Types.ObjectId.isValid(routineId)) {
      throw new BadRequestError('Invalid routine ID');
    }

    // Find the routine
    const routine = await Routine.findById(routineId);

    if (!routine) {
      throw new NotFoundError('Routine not found');
    }

    // Check ownership
    if (routine.creator.type !== 'user' || routine.creator.id?.toString() !== userId) {
      throw forbiddenError('You do not have permission to modify this routine');
    }

    // Update visibility
    routine.metadata.visibility = visibility;
    routine.metadata.updatedAt = new Date();
    
    await routine.save();

    // Invalidate cache if making public
    if (visibility === 'public') {
      await invalidateCache(`/routines`);
    }

    return routine;
  }

  /**
   * Rate a routine
   */
  async rateRoutine(
    routineId: string,
    userId: string,
    rating: number,
    review?: string
  ): Promise<IRoutine> {
    if (!mongoose.Types.ObjectId.isValid(routineId)) {
      throw new BadRequestError('Invalid routine ID');
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestError('Rating must be between 1 and 5');
    }

    // Find the routine
    const routine = await Routine.findById(routineId);

    if (!routine) {
      throw new NotFoundError('Routine not found');
    }

    // Only public routines can be rated
    if (routine.metadata.visibility !== 'public') {
      throw new BadRequestError('Only public routines can be rated');
    }

    // Check if user has already rated this routine
    const existingRating = await Rating.findOne({
      user: userId,
      routine: routineId
    });

    let savedRating;

    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      if (review) existingRating.review = review;
      existingRating.updatedAt = new Date();
      savedRating = await existingRating.save();
    } else {
      // Create new rating
      savedRating = await Rating.create({
        user: userId,
        routine: routineId,
        rating,
        review,
        createdAt: new Date()
      });

      // Increment rating count
      routine.metadata.ratingCount += 1;
    }

    // Calculate new average rating
    const allRatings = await Rating.find({ routine: routineId });
    const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / allRatings.length;

    // Update routine with new rating
    routine.metadata.rating = parseFloat(averageRating.toFixed(1));
    routine.metadata.updatedAt = new Date();
    
    await routine.save();

    // Invalidate cache
    await invalidateCache(`/routines/${routineId}`);

    return routine;
  }

  /**
   * Get routines by objective
   */
  async getRoutinesByObjective(
    objective: string,
    paginationOptions: PaginationOptions = {}
  ): Promise<{ routines: IRoutine[], total: number, page: number, limit: number, totalPages: number }> {
    const {
      page = 1,
      limit = 20,
      sort = '-metadata.rating'
    } = paginationOptions;

    const skip = (page - 1) * limit;

    // Build query for the objective
    const query = {
      objective,
      'metadata.visibility': 'public'
    };

    // Execute query
    const routines = await Routine.find(query)
      .populate({
        path: 'exercises.exerciseId',
        select: 'name media.thumbnailUrl'
      })
      .populate({
        path: 'creator.id',
        select: 'firstName lastName profile.displayName profile.avatar'
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Routine.countDocuments(query);

    return {
      routines,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get routines created by a specific user (public only)
   */
  async getRoutinesByUser(
    creatorId: string,
    paginationOptions: PaginationOptions = {}
  ): Promise<{ routines: IRoutine[], total: number, page: number, limit: number, totalPages: number }> {
    const {
      page = 1,
      limit = 20,
      sort = '-metadata.createdAt'
    } = paginationOptions;

    const skip = (page - 1) * limit;

    // Build query for the user's public routines
    const query = {
      'creator.id': creatorId,
      'creator.type': 'user',
      'metadata.visibility': 'public'
    };

    // Execute query
    const routines = await Routine.find(query)
      .populate({
        path: 'exercises.exerciseId',
        select: 'name media.thumbnailUrl'
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Routine.countDocuments(query);

    return {
      routines,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}

export const routineService = new RoutineService();