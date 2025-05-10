/**
 * Custom application error class
 * Extends the built-in Error class with additional properties for API error handling
 */
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  /**
   * Create a new AppError
   * @param message - Error message
   * @param statusCode - HTTP status code
   */
  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Mark as operational error that we can handle gracefully

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found error - creates a 404 AppError
 * @param message - Error message, defaults to 'Resource not found'
 * @returns AppError
 */
export const notFoundError = (message = 'Resource not found'): AppError => {
  return new AppError(message, 404);
};

/**
 * Unauthorized error - creates a 401 AppError
 * @param message - Error message, defaults to 'Unauthorized access'
 * @returns AppError
 */
export const unauthorizedError = (message = 'Unauthorized access'): AppError => {
  return new AppError(message, 401);
};

/**
 * Forbidden error - creates a 403 AppError
 * @param message - Error message, defaults to 'Forbidden - Insufficient permissions'
 * @returns AppError
 */
export const forbiddenError = (message = 'Forbidden - Insufficient permissions'): AppError => {
  return new AppError(message, 403);
};

/**
 * Bad request error - creates a 400 AppError
 * @param message - Error message, defaults to 'Bad request'
 * @returns AppError
 */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}


/**
 * Validation error - creates a 422 AppError
 * @param message - Error message, defaults to 'Validation failed'
 * @returns AppError
 */
export const validationError = (message = 'Validation failed'): AppError => {
  return new AppError(message, 422);
};

/**
 * Conflict error - creates a 409 AppError
 * @param message - Error message, defaults to 'Resource conflict'
 * @returns AppError
 */
export const conflictError = (message = 'Resource conflict'): AppError => {
  return new AppError(message, 409);
};

/**
 * Internal server error - creates a 500 AppError
 * @param message - Error message, defaults to 'Internal server error'
 * @returns AppError
 */
export const internalServerError = (message = 'Internal server error'): AppError => {
  return new AppError(message, 500);
};

export default {
  AppError,
  notFoundError,
  unauthorizedError,
  forbiddenError,
  BadRequestError,
  validationError,
  conflictError,
  internalServerError
};
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}