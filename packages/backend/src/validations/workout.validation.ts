// src/validations/workout.validation.ts

import Joi from 'joi';

export const workoutValidation = {
  // Validación para crear un nuevo entrenamiento
  createWorkout: Joi.object({
    routine: Joi.string().required(),
    startTime: Joi.date().default(Date.now),
    location: Joi.object({
      type: Joi.string().valid('gym', 'home', 'outdoor', 'other').default('gym'),
      name: Joi.string()
    }),
    notes: Joi.string()
  }),

  // Validación para actualizar un entrenamiento
  updateWorkout: Joi.object({
    notes: Joi.string(),
    location: Joi.object({
      type: Joi.string().valid('gym', 'home', 'outdoor', 'other'),
      name: Joi.string()
    })
  }),

  // Validación para añadir un ejercicio a un entrenamiento
  addExercise: Joi.object({
    exercise: Joi.string().required(),
    sets: Joi.array().items(Joi.object({
      weight: Joi.number().required(),
      reps: Joi.number().required(),
      duration: Joi.number(),
      rpe: Joi.number().min(1).max(10),
      completed: Joi.boolean().default(true),
      notes: Joi.string()
    })).min(1).required(),
    notes: Joi.string()
  }),

  // Validación para actualizar un ejercicio en un entrenamiento
  updateExercise: Joi.object({
    sets: Joi.array().items(Joi.object({
      weight: Joi.number().required(),
      reps: Joi.number().required(),
      duration: Joi.number(),
      rpe: Joi.number().min(1).max(10),
      completed: Joi.boolean().default(true),
      notes: Joi.string()
    })).min(1),
    notes: Joi.string()
  })
};