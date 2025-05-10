// src/utils/calculators.ts

import Record from '../models/record.model';
import mongoose from 'mongoose';

/**
 * Calcula el volumen de un set (peso × repeticiones)
 */
export const calculateVolume = (weight: number, reps: number): number => {
  return weight * reps;
};

/**
 * Calcula el 1RM estimado usando la fórmula de Epley
 * 1RM = weight * (1 + 0.0333 * reps)
 */
export const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight; // Ya es 1RM
  return weight * (1 + 0.0333 * reps);
};

/**
 * Determina si un levantamiento es un récord personal
 */
export const isPersonalRecord = async (
  userId: string,
  exerciseId: string,
  weight: number,
  reps: number,
  session?: mongoose.ClientSession
): Promise<boolean> => {
  // Para 1 repetición, comprobamos si el peso es mayor que el récord anterior
  if (reps === 1) {
    const maxWeightRecord = await Record.findOne(
      {
        user: userId,
        exercise: exerciseId,
        type: 'weight'
      },
      null,
      { session }
    ).sort({ value: -1 });
    
    return !maxWeightRecord || weight > maxWeightRecord.value;
  }
  
  // Para múltiples repeticiones, calculamos el volumen y comparamos
  const volume = calculateVolume(weight, reps);
  
  const maxVolumeRecord = await Record.findOne(
    {
      user: userId,
      exercise: exerciseId,
      type: 'volume'
    },
    null,
    { session }
  ).sort({ value: -1 });
  
  return !maxVolumeRecord || volume > maxVolumeRecord.value;
};

/**
 * Calcula calorías quemadas (estimación simplificada)
 * Esta es una estimación muy básica y debería mejorarse con algoritmos más precisos
 */
export const estimateCaloriesBurned = (
  totalVolume: number,
  durationMinutes: number,
  bodyWeightKg: number
): number => {
  // Factor base por minuto de entrenamiento de fuerza
  const baseCaloriesPerMinute = 5;
  
  // Ajuste por intensidad (usando volumen como proxy)
  const intensityFactor = Math.min(1.5, 1 + (totalVolume / 5000));
  
  // Ajuste por peso corporal
  const weightFactor = bodyWeightKg / 75;
  
  return Math.round(baseCaloriesPerMinute * durationMinutes * intensityFactor * weightFactor);
};