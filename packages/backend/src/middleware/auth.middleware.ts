import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { unauthorizedError, forbiddenError } from '../utils/errors';
import config from '../config';
import { UserRole } from '../types/user.types';
import User from '../models/user.model';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(unauthorizedError('Authentication required. Please log in.'));
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        return next(unauthorizedError('Token expired. Please log in again.'));
      }

      // Get user from database
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) {
        return next(unauthorizedError('User not found. Please log in again.'));
      }

      // Check if user is active
      if (!user.metadata.active) {
        return next(unauthorizedError('User account is inactive.'));
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      return next(unauthorizedError('Invalid token. Please log in again.'));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access to specific roles
 * @param roles - Array of allowed roles
 */
export function restrictTo(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

/**
 * Middleware to verify ownership of a resource
 * @param modelName - Name of the model to check ownership
 * @param paramName - Name of the request parameter containing resource ID
 */
export const verifyOwnership = (
  modelName: string,
  paramName: string = 'id'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user exists
      if (!req.user || !req.user._id) {
        return next(unauthorizedError('User not authenticated.'));
      }

      // Get resource ID from request parameters
      const resourceId = req.params[paramName];
      if (!resourceId) {
        return next(forbiddenError(`Resource ID not provided in parameter '${paramName}'.`));
      }

      // Get model
      const Model = require(`../models/${modelName}.model`).default;
      if (!Model) {
        return next(forbiddenError(`Model '${modelName}' not found.`));
      }

      // Check if resource exists and belongs to user
      const resource = await Model.findById(resourceId);
      if (!resource) {
        return next(forbiddenError('Resource not found.'));
      }

      // Check ownership (resource must have a user field)
      if (!resource.user || resource.user.toString() !== req.user._id.toString()) {
        return next(forbiddenError('You do not have permission to access this resource.'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Removed duplicate export to avoid conflict

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // Authentication logic
};
export default authenticate;
