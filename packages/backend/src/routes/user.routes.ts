// src/routes/user.routes.ts

import { Router } from 'express';
import authController from '../controllers/auth.controller';
import authenticate from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes
router.use(authenticate);
router.get('/me', authController.getProfile);
router.put('/me', authController.updateProfile);
router.put('/me/settings', authController.updateSettings);
router.delete('/me', authController.deactivateAccount);

export default router;