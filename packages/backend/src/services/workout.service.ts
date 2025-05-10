// src/services/workout.service.ts

import Workout, { IWorkout, IWorkoutSet } from '../models/workout.model';
import Record from '../models/record.model';
import Progress from '../models/progress.model';
import { AppError } from '../utils/errors';
import mongoose from 'mongoose';
import { calculateVolume, isPersonalRecord } from '../utils/calculators';

export class WorkoutService {
  /**
   * Crear un nuevo entrenamiento
   */
  async createWorkout(workoutData: Partial<IWorkout>): Promise<IWorkout> {
    try {
      // Crear el entrenamiento
      const workout = new Workout(workoutData);
      await workout.save();
      return workout;
    } catch (error) {
      throw new AppError('Error creating workout', 400);
    }
  }

  /**
   * Obtener un entrenamiento por ID
   */
  async getWorkoutById(id: string, userId: string): Promise<IWorkout> {
    try {
      const workout = await Workout.findOne({ _id: id, user: userId })
        .populate('routine')
        .populate('exercises.exercise');

      if (!workout) {
        throw new AppError('Workout not found', 404);
      }

      return workout;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error fetching workout', 400);
    }
  }

  /**
   * Obtener entrenamientos de un usuario
   */
  async getUserWorkouts(
    userId: string, 
    options: { 
      limit?: number; 
      offset?: number; 
      status?: string;
      fromDate?: Date;
      toDate?: Date;
      routineId?: string;
    }
  ): Promise<{ workouts: IWorkout[], total: number }> {
    try {
      const { limit = 10, offset = 0, status, fromDate, toDate, routineId } = options;
      
      const query: any = { user: userId };
      
      if (status) query.status = status;
      if (routineId) query.routine = routineId;
      
      if (fromDate || toDate) {
        query.startTime = {};
        if (fromDate) query.startTime.$gte = fromDate;
        if (toDate) query.startTime.$lte = toDate;
      }

      // Ejecutar consulta con paginación
      const [workouts, total] = await Promise.all([
        Workout.find(query)
          .sort({ startTime: -1 })
          .skip(offset)
          .limit(limit)
          .populate('routine', 'name objective')
          .lean(),
        Workout.countDocuments(query)
      ]);

      return { workouts, total };
    } catch (error) {
      throw new AppError('Error fetching workouts', 400);
    }
  }

  /**
   * Actualizar un entrenamiento
   */
  async updateWorkout(id: string, userId: string, updateData: Partial<IWorkout>): Promise<IWorkout> {
    try {
      const workout = await Workout.findOneAndUpdate(
        { _id: id, user: userId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!workout) {
        throw new AppError('Workout not found', 404);
      }

      return workout;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error updating workout', 400);
    }
  }

  /**
   * Añadir un ejercicio a un entrenamiento en progreso
   */
  async addExerciseToWorkout(
    workoutId: string, 
    userId: string, 
    exerciseData: Partial<IWorkoutSet>
  ): Promise<IWorkout> {
    try {
      const workout = await Workout.findOne({ _id: workoutId, user: userId });
      
      if (!workout) {
        throw new AppError('Workout not found', 404);
      }
      
      if (workout.status !== 'in_progress') {
        throw new AppError('Cannot add exercises to a completed workout', 400);
      }
      
      workout.exercises.push(exerciseData as any);
      await workout.save();
      
      return workout;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error adding exercise to workout', 400);
    }
  }

  /**
   * Actualizar un ejercicio en un entrenamiento
   */
  async updateExerciseInWorkout(
    workoutId: string,
    userId: string,
    exerciseId: string,
    updateData: Partial<IWorkoutSet>
  ): Promise<IWorkout> {
    try {
      const workout = await Workout.findOne({ _id: workoutId, user: userId });
      
      if (!workout) {
        throw new AppError('Workout not found', 404);
      }
      
      const exerciseIndex = workout.exercises.findIndex(
        ex => ex._id.toString() === exerciseId
      );
      
      if (exerciseIndex === -1) {
        throw new AppError('Exercise not found in workout', 404);
      }
      
      // Actualizamos solo los campos permitidos
      Object.assign(workout.exercises[exerciseIndex], updateData);
      await workout.save();
      
      return workout;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error updating exercise in workout', 400);
    }
  }

  /**
   * Completar un entrenamiento y procesar métricas
   */
  async completeWorkout(id: string, userId: string): Promise<IWorkout> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const workout = await Workout.findOne({ _id: id, user: userId })
        .populate('exercises.exercise')
        .session(session);
      
      if (!workout) {
        throw new AppError('Workout not found', 404);
      }
      
      if (workout.status === 'completed') {
        throw new AppError('Workout is already completed', 400);
      }
      
      // Actualizar el estado y la hora de finalización
      workout.status = 'completed';
      workout.endTime = new Date();
      
      if (workout.startTime && workout.endTime) {
        workout.duration = Math.floor((workout.endTime.getTime() - workout.startTime.getTime()) / 1000);
      }
      
      // Calcular métricas
      let totalVolume = 0;
      let totalReps = 0;
      let personalRecords = 0;
      
      // Procesar cada ejercicio para calcular volumen y comprobar récords
      for (const exercise of workout.exercises) {
        let exerciseVolume = 0;
        let exerciseReps = 0;
        
        for (const set of exercise.sets) {
          if (set.completed) {
            exerciseReps += set.reps;
            const setVolume = calculateVolume(set.weight, set.reps);
            exerciseVolume += setVolume;
            
            // Comprobar si es un récord personal
            const isRecord = await isPersonalRecord(
              userId,
              exercise.exercise._id.toString(),
              set.weight,
              set.reps,
              session
            );
            
            if (isRecord) {
              set.isPersonalRecord = true;
              personalRecords++;
              
              // Crear entrada de récord
              await Record.create(
                [{
                  user: userId,
                  exercise: exercise.exercise._id,
                  type: set.reps === 1 ? 'weight' : 'volume',
                  value: set.reps === 1 ? set.weight : set.weight * set.reps,
                  date: new Date(),
                  workout: workout._id
                }],
                { session }
              );
            }
          }
        }
        
        totalVolume += exerciseVolume;
        totalReps += exerciseReps;
        
        // Registrar progreso para este ejercicio
        await Progress.create(
          [{
            user: userId,
            type: 'exercise',
            metric: `${exercise.exercise._id}_volume`,
            date: new Date(),
            value: exerciseVolume,
            unit: 'kg',
            context: {
              workout: workout._id,
              exercise: exercise.exercise._id
            },
            source: 'workout'
          }],
          { session }
        );
      }
      
      // Actualizar métricas totales del entrenamiento
      workout.metrics = {
        totalVolume,
        totalReps,
        personalRecords,
        // Para calorías quemadas necesitaríamos más información o estimarlo
        caloriesBurned: Math.round(totalVolume * 0.05) // Estimación muy simplificada
      };
      
      await workout.save({ session });
      
      // Registrar métricas de entrenamiento
      await Progress.create(
        [{
          user: userId,
          type: 'performance',
          metric: 'workout_duration',
          date: new Date(),
          value: workout.duration || 0,
          unit: 'seconds',
          context: {
            workout: workout._id
          },
          source: 'workout'
        },
        {
          user: userId,
          type: 'performance',
          metric: 'workout_volume',
          date: new Date(),
          value: totalVolume,
          unit: 'kg',
          context: {
            workout: workout._id
          },
          source: 'workout'
        }],
        { session }
      );
      
      await session.commitTransaction();
      return workout;
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof AppError) throw error;
      throw new AppError('Error completing workout', 400);
    } finally {
      session.endSession();
    }
  }

  /**
   * Eliminar un entrenamiento
   */
  async deleteWorkout(id: string, userId: string): Promise<void> {
    try {
      const result = await Workout.findOneAndDelete({ _id: id, user: userId });
      
      if (!result) {
        throw new AppError('Workout not found', 404);
      }
      
      // También se podrían eliminar los registros de progreso asociados,
      // pero podría ser mejor mantenerlos para análisis histórico
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error deleting workout', 400);
    }
  }

  /**
   * Obtener estadísticas de entrenamientos
   */
  async getWorkoutStats(userId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      // Determinar fechas según el período
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      // Estadísticas generales
      const stats = await Workout.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), status: 'completed', startTime: { $gte: startDate } } },
        { $group: {
          _id: null,
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalVolume: { $sum: '$metrics.totalVolume' },
          personalRecords: { $sum: '$metrics.personalRecords' },
          averageDuration: { $avg: '$duration' }
        }}
      ]);
      
      // Distribución por día de la semana
      const dayDistribution = await Workout.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), status: 'completed', startTime: { $gte: startDate } } },
        { $group: {
          _id: { $dayOfWeek: '$startTime' },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]);
      
      // Obtener rutinas más utilizadas
      const topRoutines = await Workout.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), status: 'completed', startTime: { $gte: startDate } } },
        { $group: {
          _id: '$routine',
          count: { $sum: 1 },
          totalVolume: { $sum: '$metrics.totalVolume' },
          averageDuration: { $avg: '$duration' }
        }},
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: {
          from: 'routines',
          localField: '_id',
          foreignField: '_id',
          as: 'routineDetails'
        }},
        { $unwind: '$routineDetails' },
        { $project: {
          routine: '$routineDetails.name',
          count: 1,
          totalVolume: 1,
          averageDuration: 1
        }}
      ]);
      
      return {
        overall: stats[0] || { count: 0, totalDuration: 0, totalVolume: 0, personalRecords: 0 },
        dayDistribution: dayDistribution,
        topRoutines: topRoutines
      };
    } catch (error) {
      throw new AppError('Error fetching workout statistics', 400);
    }
  }
}

export default new WorkoutService();