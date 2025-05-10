// src/middleware/validate.middleware.ts

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { BadRequestError } from '../utils/errors';

/**
 * Middleware factory for validating request data
 * @param schema Joi validation schema
 * @param source What part of the request to validate
 */
export const validate = (schema: Joi.Schema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true
    });


    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      return next(new BadRequestError(errorMessage));
    }

    // Replace request data with validated data
    req[source] = value;
    next();
  };
};
// Correctly export validateRequest
export function validateRequest(schema: any, location: string = 'body') {
  return (req: any, res: any, next: any) => {
    // Validation logic here
    next();
  };
}

// Common validation schemas
export const schemas = {
  id: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID must be a valid MongoDB ObjectId'
      })
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    sort: Joi.string()
  }),

  exercise: {
    create: Joi.object({
      name: Joi.string().trim().min(3).max(100).required(),
      description: Joi.string().trim().min(10).required(),
      instructions: Joi.array().items(Joi.string().trim().min(5)).min(1).required(),
      type: Joi.string().required(),
      mechanics: Joi.string().required(),
      equipment: Joi.array().items(Joi.string()).min(1).required(),
      difficultyLevel: Joi.number().integer().min(1).max(5).required(),
      muscleGroups: Joi.object({
        primary: Joi.array().items(Joi.string()).min(1).required(),
        secondary: Joi.array().items(Joi.string())
      }).required(),
      metrics: Joi.object({
        force: Joi.string().required(),
        level: Joi.string().required(),
        weightType: Joi.string().required()
      }).required(),
      media: Joi.object({
        gifUrl: Joi.string().uri(),
        thumbnailUrl: Joi.string().uri(),
        videoUrl: Joi.string().uri(),
        images: Joi.array().items(Joi.string().uri())
      }),
      variations: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
      alternatives: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
      metadata: Joi.object({
        tags: Joi.array().items(Joi.string()),
        public: Joi.boolean()
      })
    }),

    update: Joi.object({
      name: Joi.string().trim().min(3).max(100),
      description: Joi.string().trim().min(10),
      instructions: Joi.array().items(Joi.string().trim().min(5)).min(1),
      type: Joi.string(),
      mechanics: Joi.string(),
      equipment: Joi.array().items(Joi.string()).min(1),
      difficultyLevel: Joi.number().integer().min(1).max(5),
      muscleGroups: Joi.object({
        primary: Joi.array().items(Joi.string()).min(1),
        secondary: Joi.array().items(Joi.string())
      }),
      metrics: Joi.object({
        force: Joi.string(),
        level: Joi.string(),
        weightType: Joi.string()
      }),
      media: Joi.object({
        gifUrl: Joi.string().uri(),
        thumbnailUrl: Joi.string().uri(),
        videoUrl: Joi.string().uri(),
        images: Joi.array().items(Joi.string().uri())
      }),
      variations: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
      alternatives: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
      metadata: Joi.object({
        tags: Joi.array().items(Joi.string()),
        public: Joi.boolean()
      })
    }).min(1) // Require at least one field
  },

  routine: {
    create: Joi.object({
      name: Joi.string().trim().min(3).max(100).required(),
      description: Joi.string().trim().min(10).required(),
      objective: Joi.string().required(),
      level: Joi.string().required(),
      duration: Joi.object({
        estimated: Joi.number().integer().min(1).required()
      }).required(),
      schedule: Joi.array().items(Joi.number().integer().min(0).max(6)),
      frequency: Joi.number().integer().min(1).max(7),
      exercises: Joi.array().items(
        Joi.object({
          exerciseId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
          order: Joi.number().integer().min(1).required(),
          sets: Joi.array().items(
            Joi.object({
              type: Joi.string(),
              reps: Joi.object({
                count: Joi.number().integer().min(1).required(),
                type: Joi.string()
              }).required(),
              weight: Joi.object({
                value: Joi.number(),
                unit: Joi.string(),
                calculation: Joi.string()
              }),
              rest: Joi.number().integer(),
              tempo: Joi.string()
            })
          ).required(),
          notes: Joi.string(),
          supersetWith: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        })
      ).min(1).required(),
      warmup: Joi.array().items(
        Joi.object({
          exerciseId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
          duration: Joi.number().integer(),
          sets: Joi.number().integer(),
          reps: Joi.number().integer()
        })
      ),
      cooldown: Joi.array().items(
        Joi.object({
          exerciseId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
          duration: Joi.number().integer(),
          sets: Joi.number().integer(),
          reps: Joi.number().integer()
        })
      ),
      equipment: Joi.array().items(Joi.string()),
      muscleGroups: Joi.object({
        primary: Joi.array().items(Joi.string()).required(),
        secondary: Joi.array().items(Joi.string())
      }),
      metadata: Joi.object({
        difficulty: Joi.number().integer().min(1).max(5),
        tags: Joi.array().items(Joi.string()),
        visibility: Joi.string().valid('public', 'private', 'friends')
      })
    }),

    update: Joi.object({
      name: Joi.string().trim().min(3).max(100),
      description: Joi.string().trim().min(10),
      objective: Joi.string(),
      level: Joi.string(),
      duration: Joi.object({
        estimated: Joi.number().integer().min(1)
      }),
      schedule: Joi.array().items(Joi.number().integer().min(0).max(6)),
      frequency: Joi.number().integer().min(1).max(7),
      exercises: Joi.array().items(
        Joi.object({
          exerciseId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
          order: Joi.number().integer().min(1).required(),
          sets: Joi.array().items(
            Joi.object({
              type: Joi.string(),
              reps: Joi.object({
                count: Joi.number().integer().min(1).required(),
                type: Joi.string()
              }).required(),
              weight: Joi.object({
                value: Joi.number(),
                unit: Joi.string(),
                calculation: Joi.string()
              }),
              rest: Joi.number().integer(),
              tempo: Joi.string()
            })
          ).required(),
          notes: Joi.string(),
          supersetWith: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        })
      ).min(1),
      warmup: Joi.array().items(
        Joi.object({
          exerciseId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
          duration: Joi.number().integer(),
          sets: Joi.number().integer(),
          reps: Joi.number().integer()
        })
      ),
      cooldown: Joi.array().items(
        Joi.object({
          exerciseId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
          duration: Joi.number().integer(),
          sets: Joi.number().integer(),
          reps: Joi.number().integer()
        })
      ),
      equipment: Joi.array().items(Joi.string()),
      muscleGroups: Joi.object({
        primary: Joi.array().items(Joi.string()),
        secondary: Joi.array().items(Joi.string())
      }),
      metadata: Joi.object({
        difficulty: Joi.number().integer().min(1).max(5),
        tags: Joi.array().items(Joi.string())
      })
    }).min(1),

    copy: Joi.object({
      name: Joi.string().trim().min(3).max(100),
      description: Joi.string().trim().min(10)
    }),

    publish: Joi.object({
      visibility: Joi.string().valid('public', 'private', 'friends').required()
    }),

    rate: Joi.object({
      rating: Joi.number().integer().min(1).max(5).required(),
      review: Joi.string().max(500)
    })
  }
};
export const refreshToken = (req: any, res: any) => {
  // Logic for refresh token
};

export const forgotPassword = (req: any, res: any) => {
  // Logic for forgot password
};

export const resetPassword = (req: any, res: any) => {
  // Logic for reset password
};

export const getProfile = (req: any, res: any) => {
  // Logic for get profile
};

export const updateProfile = (req: any, res: any) => {
  // Logic for update profile
};

export const verifyEmail = (req: any, res: any) => {
  // Logic for verify email
};

export const logout = (req: any, res: any) => {
  // Logic for logout
};

export const socialAuth = (req: any, res: any) => {
  // Logic for social auth
};