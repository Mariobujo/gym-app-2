// src/services/exercise.service.ts

import mongoose from 'mongoose';
import Exercise, { IExercise } from '../models/exercise.model';
import Favorite from '../models/favorite.model';
import { NotFoundError, BadRequestError, forbiddenError } from '../utils/errors';
import { UserRole, MuscleGroup, ExerciseEquipment } from '../types/enums';

export interface ExerciseFilters {
  type?: string;
  muscleGroups?: string | string[];
  equipment?: string | string[];
  difficultyLevel?: number;
  level?: string;
  weightType?: string;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
}

export class ExerciseService {
  /**
   * Get all exercises with filtering and pagination
   */
  async getExercises(
    filters: ExerciseFilters = {}, 
    paginationOptions: PaginationOptions = {}
  ): Promise<{ exercises: IExercise[], total: number, page: number, limit: number, totalPages: number }> {
    const { 
      page = 1, 
      limit = 20, 
      sort = '-metadata.popularity' 
    } = paginationOptions;
    
    const skip = (page - 1) * limit;
    
    // Build filter query
    const query: any = { 'metadata.public': true };
    
    if (filters.type) {
      query.type = filters.type;
    }
    
    if (filters.muscleGroups) {
      const muscleGroupArray = Array.isArray(filters.muscleGroups) 
        ? filters.muscleGroups 
        : [filters.muscleGroups];
      
      query['muscleGroups.primary'] = { $in: muscleGroupArray };
    }
    
    if (filters.equipment) {
      const equipmentArray = Array.isArray(filters.equipment) 
        ? filters.equipment 
        : [filters.equipment];
      
      query.equipment = { $in: equipmentArray };
    }
    
    if (filters.difficultyLevel) {
      query.difficultyLevel = filters.difficultyLevel;
    }
    
    if (filters.level) {
      query['metrics.level'] = filters.level;
    }
    
    if (filters.weightType) {
      query['metrics.weightType'] = filters.weightType;
    }
    
    // Execute query with pagination
    const exercises = await Exercise.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
    
    // Get total count for pagination
    const total = await Exercise.countDocuments(query).exec();
    
    return {
      exercises,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  /**
   * Get a single exercise by ID
   */
  async getExerciseById(id: string): Promise<IExercise> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid exercise ID');
    }
    
    const exercise = await Exercise.findById(id)
      .populate('variations', 'name media.thumbnailUrl')
      .populate('alternatives', 'name media.thumbnailUrl')
      .exec();
    
    if (!exercise) {
      throw new NotFoundError('Exercise not found');
    }
    
    if (!exercise.metadata.public) {
      throw new NotFoundError('Exercise not found or is private');
    }
    
    // Increment popularity counter for the exercise
    await Exercise.findByIdAndUpdate(id, {
      $inc: { 'metadata.popularity': 1 }
    });
    
    return exercise;
  }
  
  /**
   * Create a new exercise
   */
  async createExercise(exerciseData: Partial<IExercise>, userId: string, role: string): Promise<IExercise> {
    // Validate that the user has the right role
    if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
      throw forbiddenError('You do not have permission to create exercises');
    }
    
    // Check if exercise with the same name already exists
    const existingExercise = await Exercise.findOne({ name: exerciseData.name });
    if (existingExercise) {
      throw new BadRequestError('An exercise with this name already exists');
    }
    
    // Set creator metadata
    const exercise = new Exercise({
      ...exerciseData,
      metadata: {
        ...exerciseData.metadata,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    await exercise.save();
    
    return exercise;
  }
  
  /**
   * Update an existing exercise
   */
  async updateExercise(id: string, exerciseData: Partial<IExercise>, userId: string, role: string): Promise<IExercise> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid exercise ID');
    }
    
    const exercise = await Exercise.findById(id);
    
    if (!exercise) {
      throw new NotFoundError('Exercise not found');
    }
    
    // Check permission - only admins or the creator can update
    const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
    const isCreator = exercise.metadata.createdBy.toString() === userId;
    
    if (!isAdmin && !isCreator) {
      throw forbiddenError('You do not have permission to update this exercise');
    }
    
    // Don't allow changing the name to one that already exists
    if (exerciseData.name && exerciseData.name !== exercise.name) {
      const existingExercise = await Exercise.findOne({ name: exerciseData.name });
      if (existingExercise) {
        throw new BadRequestError('An exercise with this name already exists');
      }
    }
    
    // Update the exercise
    Object.assign(exercise, {
      ...exerciseData,
      'metadata.updatedAt': new Date()
    });
    
    await exercise.save();
    
    return exercise;
  }
  
  /**
   * Delete an exercise
   */
  async deleteExercise(id: string, userId: string, role: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid exercise ID');
    }
    
    const exercise = await Exercise.findById(id);
    
    if (!exercise) {
      throw new NotFoundError('Exercise not found');
    }
    
    // Check permission - only admins or the creator can delete
    const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
    const isCreator = exercise.metadata.createdBy.toString() === userId;
    
    if (!isAdmin && !isCreator) {
      throw forbiddenError('You do not have permission to delete this exercise');
    }
    
    // Remove from favorites
    await Favorite.deleteMany({ exercise: id });
    
    // Remove references from other exercises
    await Exercise.updateMany(
      { variations: id },
      { $pull: { variations: id } }
    );
    
    await Exercise.updateMany(
      { alternatives: id },
      { $pull: { alternatives: id } }
    );
    
    // Delete the exercise
    await Exercise.findByIdAndDelete(id);
  }
  
  /**
   * Search exercises by text
   */
  async searchExercises(
    searchQuery: string,
    paginationOptions: PaginationOptions = {}
  ): Promise<{ exercises: IExercise[], total: number, page: number, limit: number, totalPages: number }> {
    const { 
      page = 1, 
      limit = 20, 
      sort = 'score' 
    } = paginationOptions;
    
    const skip = (page - 1) * limit;
    
    // Build text search query
    const query = {
      $text: { $search: searchQuery },
      'metadata.public': true
    };
    
    // Execute search with pagination
    const exercises = await Exercise.find(
      query,
      { score: { $meta: 'textScore' } } // Add text score for sorting
    )
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .exec();
    
    // Get total count for pagination
    const total = await Exercise.countDocuments(query).exec();
    
    return {
      exercises,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  /**
   * Get exercises by muscle group
   */
  async getExercisesByMuscleGroup(
    muscleGroup: MuscleGroup,
    paginationOptions: PaginationOptions = {}
  ): Promise<{ exercises: IExercise[], total: number, page: number, limit: number, totalPages: number }> {
    const { 
      page = 1, 
      limit = 20, 
      sort = '-metadata.popularity' 
    } = paginationOptions;
    
    const skip = (page - 1) * limit;
    
    // Build query for muscle group (both primary and secondary)
    const query = {
      $or: [
        { 'muscleGroups.primary': muscleGroup },
        { 'muscleGroups.secondary': muscleGroup }
      ],
      'metadata.public': true
    };
    
    // Execute query
    const exercises = await Exercise.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
    
    // Get total count for pagination
    const total = await Exercise.countDocuments(query).exec();
    
    return {
      exercises,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  /**
   * Get exercises by equipment
   */
  async getExercisesByEquipment(
    equipment: ExerciseEquipment,
    paginationOptions: PaginationOptions = {}
  ): Promise<{ exercises: IExercise[], total: number, page: number, limit: number, totalPages: number }> {
    const { 
      page = 1, 
      limit = 20, 
      sort = '-metadata.popularity' 
    } = paginationOptions;
    
    const skip = (page - 1) * limit;
    
    // Build query for equipment
    const query = {
      equipment: equipment,
      'metadata.public': true
    };
    
    // Execute query
    const exercises = await Exercise.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
    
    // Get total count for pagination
    const total = await Exercise.countDocuments(query).exec();
    
    return {
      exercises,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  /**
   * Toggle exercise as favorite
   */
  async toggleFavorite(exerciseId: string, userId: string): Promise<{ isFavorite: boolean }> {
    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      throw new BadRequestError('Invalid exercise ID');
    }
    
    // Verify exercise exists
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      throw new NotFoundError('Exercise not found');
    }
    
    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      user: userId,
      exercise: exerciseId
    });
    
    if (existingFavorite) {
      // Remove from favorites
      await Favorite.findByIdAndDelete(existingFavorite._id);
      return { isFavorite: false };
    } else {
      // Add to favorites
      await Favorite.create({
        user: userId,
        exercise: exerciseId,
        createdAt: new Date()
      });
      return { isFavorite: true };
    }
  }
  
  /**
   * Get user's favorite exercises
   */
  async getFavoriteExercises(
    userId: string,
    paginationOptions: PaginationOptions = {}
  ): Promise<{ exercises: IExercise[], total: number, page: number, limit: number, totalPages: number }> {
    const { 
      page = 1, 
      limit = 20, 
      sort = '-createdAt' 
    } = paginationOptions;
    
    const skip = (page - 1) * limit;
    
    // Find user's favorites
    const favorites = await Favorite.find({ user: userId })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
    
    const exerciseIds = favorites.map(favorite => favorite.exercise);
    
    // Get the actual exercises
    const exercises = await Exercise.find({
      _id: { $in: exerciseIds },
      'metadata.public': true
    }).exec();
    
    // Re-order exercises to match favorites order
    const orderedExercises = exerciseIds.map(id => 
      exercises.find(ex => ex._id.toString() === id.toString())
    ).filter(Boolean) as IExercise[];
    
    // Get total count for pagination
    const total = await Favorite.countDocuments({ user: userId }).exec();
    
    return {
      exercises: orderedExercises,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  /**
   * Check if an exercise is favorited by a user
   */
  async isExerciseFavorited(exerciseId: string, userId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      throw new BadRequestError('Invalid exercise ID');
    }
    
    const favorite = await Favorite.findOne({
      user: userId,
      exercise: exerciseId
    });
    
    return !!favorite;
  }
}

export const exerciseService = new ExerciseService();