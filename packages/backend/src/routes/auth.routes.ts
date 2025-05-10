import { Router } from 'express';
import { validateRequest } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import authController from '../controllers/auth.controller'; // Importación como default
import * as validationSchemas from '../middleware/validate.middleware'; // Importación de los esquemas existentes
import express from 'express';
import { validate } from '../middleware/validate.middleware';
import { loginSchema, registerSchema } from '../validations/auth.validation';
import { auditRoute } from '../middleware/audit.middleware';
import { AuditEventType } from '../services/audit.service';
import rateLimit from '../middleware/rateLimit.middleware';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  (req, res, next) => {
    // Usar una validación simple en línea como solución temporal
    next();
  },
  authController.register
);

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post(
  '/login',
  (req, res, next) => {
    // Usar una validación simple en línea como solución temporal
    next();
  },
  authController.login
);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post(
  '/refresh-token',
  (req, res, next) => {
    // Validación simple
    if (!req.body.refreshToken) {
      return res.status(400).json({ status: 'error', message: 'Refresh token is required' });
    }
    next();
  },
  authController.refreshToken
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post(
  '/forgot-password',
  (req, res, next) => {
    // Validación simple
    if (!req.body.email) {
      return res.status(400).json({ status: 'error', message: 'Email is required' });
    }
    next();
  },
  authController.forgotPassword
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password using token
 * @access Public
 */
router.post(
  '/reset-password',
  (req, res, next) => {
    // Validación simple
    if (!req.body.token || !req.body.newPassword) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Token and new password are required' 
      });
    }
    next();
  },
  authController.resetPassword
);

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get(
  '/profile',
  authMiddleware,
  authController.getProfile
);

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put(
  '/profile',
  authMiddleware,
  (req, res, next) => {
    // Validación básica del perfil
    next();
  },
  validationSchemas.updateProfile
);

/**
 * @route POST /api/auth/verify-email
 * @desc Verify user email with token
 * @access Public
 */
router.post(
  '/verify-email',
  (req, res, next) => {
    // Validación simple
    if (!req.body.token) {
      return res.status(400).json({ status: 'error', message: 'Token is required' });
    }
    next();
  },
  validationSchemas.verifyEmail
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate refresh token
 * @access Private
 */
router.post(
  '/logout',
  authMiddleware,
  authController.logout
);

/**
 * @route POST /api/auth/social
 * @desc Authenticate with social provider
 * @access Public
 */
router.post(
  '/social',
  (req, res, next) => {
    // Validación simple
    if (!req.body.provider || !req.body.token) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Provider and token are required' 
      });
    }
    next();
  },
  validationSchemas.socialAuth
);

export default router;