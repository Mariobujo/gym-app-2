// packages/mobile/src/api/workout.api.ts

import apiClient from './apiClient';
import { IWorkout, IWorkoutSet, IWorkoutStats } from '@gym-app/shared/src/types';

export const workoutApi = {
  // Crear un nuevo entrenamiento
  createWorkout: async (workoutData: Partial<IWorkout>): Promise<IWorkout> => {
    const response = await apiClient.post('/workouts', workoutData);
    return response.data.data.workout;
  },
  
  // Obtener un entrenamiento por ID
  getWorkout: async (id: string): Promise<IWorkout> => {
    const response = await apiClient.get(`/workouts/${id}`);
    return response.data.data.workout;
  },
  
  // Obtener entrenamientos del usuario
  getUserWorkouts: async (options: {
    limit?: number;
    offset?: number;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    routineId?: string;
  } = {}): Promise<{ workouts: IWorkout[], total: number }> => {
    const params = new URLSearchParams();
    
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.status) params.append('status', options.status);
    if (options.fromDate) params.append('fromDate', options.fromDate.toISOString());
    if (options.toDate) params.append('toDate', options.toDate.toISOString());
    if (options.routineId) params.append('routineId', options.routineId);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/workouts${query}`);
    return {
      workouts: response.data.data.workouts,
      total: response.data.total
    };
  },
  
  // Actualizar un entrenamiento
  updateWorkout: async (id: string, updateData: Partial<IWorkout>): Promise<IWorkout> => {
    const response = await apiClient.patch(`/workouts/${id}`, updateData);
    return response.data.data.workout;
  },
  
  // Añadir ejercicio a un entrenamiento
  addExerciseToWorkout: async (workoutId: string, exerciseData: Partial<IWorkoutSet>): Promise<IWorkout> => {
    const response = await apiClient.post(`/workouts/${workoutId}/exercises`, exerciseData);
    return response.data.data.workout;
  },
  
  // Actualizar ejercicio en un entrenamiento
  updateExerciseInWorkout: async (
    workoutId: string,
    exerciseId: string,
    updateData: Partial<IWorkoutSet>
  ): Promise<IWorkout> => {
    const response = await apiClient.patch(
      `/workouts/${workoutId}/exercises/${exerciseId}`,
      updateData
    );
    return response.data.data.workout;
  },
  
  // Completar un entrenamiento
  completeWorkout: async (id: string): Promise<IWorkout> => {
    const response = await apiClient.patch(`/workouts/${id}/complete`);
    return response.data.data.workout;
  },
  
  // Eliminar un entrenamiento
  deleteWorkout: async (id: string): Promise<void> => {
    await apiClient.delete(`/workouts/${id}`);
  },
  
  // Obtener estadísticas de entrenamiento
  getWorkoutStats: async (period: 'week' | 'month' | 'year' = 'month'): Promise<IWorkoutStats> => {
    const response = await apiClient.get(`/workouts/stats?period=${period}`);
    return response.data.data.stats;
  }
};

export default workoutApi;