// packages/backend/src/validation/auth.validation.ts

import Joi from 'joi';

/**
 * Validation schema for login requests
 */
export const validateLoginInput = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email cannot be empty',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.empty': 'Password cannot be empty',
      'any.required': 'Password is required'
    })
  });

  return schema.validate(data);
};

/**
 * Validation schema for user registration
 */
export const validateRegisterInput = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email cannot be empty',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.empty': 'Password cannot be empty',
      'any.required': 'Password is required'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your password'
    }),
    profile: Joi.object({
      firstName: Joi.string().required().messages({
        'string.empty': 'First name cannot be empty',
        'any.required': 'First name is required'
      }),
      lastName: Joi.string().required().messages({
        'string.empty': 'Last name cannot be empty',
        'any.required': 'Last name is required'
      }),
      displayName: Joi.string().allow('').optional(),
      birthdate: Joi.date().iso().allow(null).optional(),
      gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
      weight: Joi.number().positive().allow(null).optional(),
      height: Joi.number().positive().allow(null).optional(),
      fitnessLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner'),
      goals: Joi.array().items(Joi.string()).default([]),
      equipmentAvailable: Joi.array().items(Joi.string()).default([]),
      bio: Joi.string().allow('').optional()
    }).default({}),
    settings: Joi.object({
      notifications: Joi.object({
        workout: Joi.boolean().default(true),
        achievements: Joi.boolean().default(true),
        reminders: Joi.boolean().default(true),
        marketing: Joi.boolean().default(false)
      }).default({}),
      privacy: Joi.object({
        profileVisibility: Joi.string().valid('public', 'friends', 'private').default('private'),
        progressVisibility: Joi.string().valid('public', 'friends', 'private').default('private'),
        workoutVisibility: Joi.string().valid('public', 'friends', 'private').default('private')
      }).default({}),
      preferences: Joi.object({
        darkMode: Joi.boolean().default(false),
        language: Joi.string().default('en'),
        units: Joi.string().valid('metric', 'imperial').default('metric'),
        workoutSettings: Joi.object({
          countdownTime: Joi.number().default(3),
          restTimers: Joi.boolean().default(true),
          audioFeedback: Joi.boolean().default(true)
        }).default({})
      }).default({})
    }).default({})
  });

  return schema.validate(data);
};

// Nuevos esquemas de validación para las rutas

/**
 * Schema for login route
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email cannot be empty',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.empty': 'Password cannot be empty',
    'any.required': 'Password is required'
  })
});

/**
 * Schema for register route
 */
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email cannot be empty',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.empty': 'Password cannot be empty',
    'any.required': 'Password is required'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your password'
  }),
  firstName: Joi.string().required().messages({
    'string.empty': 'First name cannot be empty',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().required().messages({
    'string.empty': 'Last name cannot be empty',
    'any.required': 'Last name is required'
  }),
  // Campos adicionales opcionales para el registro
  profile: Joi.object().default({})
});

/**
 * Schema for refresh token route
 */
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token cannot be empty',
    'any.required': 'Refresh token is required'
  })
});

/**
 * Schema for email validation (used in forgot password)
 */
export const emailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email cannot be empty',
    'any.required': 'Email is required'
  })
});

/**
 * Schema for password reset
 */
export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Token cannot be empty',
    'any.required': 'Token is required'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'string.empty': 'New password cannot be empty',
    'any.required': 'New password is required'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your new password'
  })
});

/**
 * Schema for updating user profile
 */
export const updateProfileSchema = Joi.object({
  firstName: Joi.string().messages({
    'string.empty': 'First name cannot be empty'
  }),
  lastName: Joi.string().messages({
    'string.empty': 'Last name cannot be empty'
  }),
  displayName: Joi.string().allow(''),
  birthdate: Joi.date().iso().allow(null),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say'),
  weight: Joi.number().positive().allow(null),
  height: Joi.number().positive().allow(null),
  fitnessLevel: Joi.string().valid('beginner', 'intermediate', 'advanced'),
  goals: Joi.array().items(Joi.string()),
  equipmentAvailable: Joi.array().items(Joi.string()),
  bio: Joi.string().allow('')
}).min(1).messages({
  'object.min': 'At least one field is required for update'
});

/**
 * Schema for email verification
 */
export const verifyEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Verification token cannot be empty',
    'any.required': 'Verification token is required'
  })
});

/**
 * Schema for social authentication
 */
export const socialAuthSchema = Joi.object({
  provider: Joi.string().valid('google', 'facebook', 'apple').required().messages({
    'string.empty': 'Provider cannot be empty',
    'any.required': 'Provider is required',
    'any.only': 'Provider must be one of: google, facebook, apple'
  }),
  token: Joi.string().required().messages({
    'string.empty': 'Token cannot be empty',
    'any.required': 'Token is required'
  }),
  // Campos opcionales específicos para autenticación social
  email: Joi.string().email(),
  firstName: Joi.string(),
  lastName: Joi.string(),
  photoUrl: Joi.string()
});