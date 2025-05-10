import Joi from 'joi';
import { MetricType } from '../types/progress.types';

// Schema for adding a new metric
const addMetricSchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(MetricType))
    .required()
    .messages({
      'any.required': 'Metric type is required',
      'any.only': 'Invalid metric type. Must be one of: ' + Object.values(MetricType).join(', ')
    }),
  
  value: Joi.number()
    .required()
    .custom((value, helpers) => {
      const type = helpers.state.ancestors[0].type;
      
      // Validate weight (must be positive and reasonable)
      if (type === MetricType.WEIGHT && (value <= 0 || value > 500)) {
        return helpers.error('any.invalid');
      }
      
      // Validate body fat percentage (between 0 and 100)
      if (type === MetricType.BODY_FAT && (value < 0 || value > 100)) {
        return helpers.error('any.invalid');
      }
      
      // Validate measurements (must be positive and reasonable)
      if (
        (type === MetricType.CHEST || 
         type === MetricType.WAIST ||
         type === MetricType.HIPS ||
         type === MetricType.ARMS ||
         type === MetricType.THIGHS) && 
         (value <= 0 || value > 300)
      ) {
        return helpers.error('any.invalid');
      }
      
      return value;
    })
    .messages({
      'any.required': 'Metric value is required',
      'number.base': 'Value must be a number',
      'any.invalid': 'Invalid value for the specified metric type'
    }),
  
  date: Joi.date()
    .default(Date.now)
    .max('now')
    .messages({
      'date.base': 'Date must be a valid date',
      'date.max': 'Date cannot be in the future'
    }),
  
  notes: Joi.string()
    .max(500)
    .messages({
      'string.max': 'Notes cannot be more than 500 characters'
    })
});

// Schema for updating an existing metric
const updateMetricSchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(MetricType))
    .messages({
      'any.only': 'Invalid metric type. Must be one of: ' + Object.values(MetricType).join(', ')
    }),
  
  value: Joi.number()
    .custom((value, helpers) => {
      const type = helpers.state.ancestors[0].type;
      
      if (!type) {
        return value; // If no type provided, skip type-specific validation
      }
      
      // Validate weight (must be positive and reasonable)
      if (type === MetricType.WEIGHT && (value <= 0 || value > 500)) {
        return helpers.error('any.invalid');
      }
      
      // Validate body fat percentage (between 0 and 100)
      if (type === MetricType.BODY_FAT && (value < 0 || value > 100)) {
        return helpers.error('any.invalid');
      }
      
      // Validate measurements (must be positive and reasonable)
      if (
        (type === MetricType.CHEST || 
         type === MetricType.WAIST ||
         type === MetricType.HIPS ||
         type === MetricType.ARMS ||
         type === MetricType.THIGHS) && 
         (value <= 0 || value > 300)
      ) {
        return helpers.error('any.invalid');
      }
      
      return value;
    })
    .messages({
      'number.base': 'Value must be a number',
      'any.invalid': 'Invalid value for the specified metric type'
    }),
  
  date: Joi.date()
    .max('now')
    .messages({
      'date.base': 'Date must be a valid date',
      'date.max': 'Date cannot be in the future'
    }),
  
  notes: Joi.string()
    .max(500)
    .messages({
      'string.max': 'Notes cannot be more than 500 characters'
    })
})
.min(1) // At least one field must be provided
.messages({
  'object.min': 'At least one field must be provided for update'
});

// Schema for date range queries
const dateRangeSchema = Joi.object({
  startDate: Joi.date()
    .max('now')
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.max': 'Start date cannot be in the future'
    }),
  
  endDate: Joi.date()
    .min(Joi.ref('startDate'))
    .max('now')
    .messages({
      'date.base': 'End date must be a valid date',
      'date.min': 'End date cannot be before start date',
      'date.max': 'End date cannot be in the future'
    }),
  
  type: Joi.string()
    .valid(...Object.values(MetricType))
    .messages({
      'any.only': 'Invalid metric type. Must be one of: ' + Object.values(MetricType).join(', ')
    })
});

// Schema for comparing metrics between periods
const compareMetricsSchema = Joi.object({
  period1Start: Joi.date()
    .required()
    .messages({
      'any.required': 'Period 1 start date is required',
      'date.base': 'Period 1 start date must be a valid date'
    }),
  
  period1End: Joi.date()
    .required()
    .min(Joi.ref('period1Start'))
    .messages({
      'any.required': 'Period 1 end date is required',
      'date.base': 'Period 1 end date must be a valid date',
      'date.min': 'Period 1 end date cannot be before its start date'
    }),
  
  period2Start: Joi.date()
    .required()
    .messages({
      'any.required': 'Period 2 start date is required',
      'date.base': 'Period 2 start date must be a valid date'
    }),
  
  period2End: Joi.date()
    .required()
    .min(Joi.ref('period2Start'))
    .messages({
      'any.required': 'Period 2 end date is required',
      'date.base': 'Period 2 end date must be a valid date',
      'date.min': 'Period 2 end date cannot be before its start date'
    }),
  
  type: Joi.string()
    .valid(...Object.values(MetricType))
    .messages({
      'any.only': 'Invalid metric type. Must be one of: ' + Object.values(MetricType).join(', ')
    })
});

export const progressValidation = {
  addMetricSchema,
  updateMetricSchema,
  dateRangeSchema,
  compareMetricsSchema
};