import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { AppError } from '../utils/errors';
import { validateLoginInput, validateRegisterInput } from '../validations/auth.validation';
import auditService, { AuditEventType } from '../services/audit.service';

/**
 * Controller for authentication related operations
 */
export class AuthController {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
  }

  /**
   * Register a new user
   * @route POST /api/auth/register
   */
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate input
      const { error, value } = validateRegisterInput(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Check if user with email already exists
      const existingUser = await this.userService.findByEmail(value.email);
      if (existingUser) {
        return next(new AppError('Email already in use', 400));
      }

      // Create new user
      const newUser = await this.userService.createUser(value);

      // Generate token
      const token = this.authService.generateToken(newUser);

      // Return new user and token
      res.status(201).json({
        status: 'success',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: null, // Removed usage of non-existent property
            lastName: null, // Removed usage of non-existent property
            displayName: newUser.profile.displayName,
          },
          token
        }
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Login user
   * @route POST /api/auth/login
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate input
      const { error, value } = validateLoginInput(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Código existente
      const { email, password } = value;
      const user = await this.authService.validateUser(email, password);
      
      if (!user) {
        // Auditoría de fallo de login
        await auditService.logEvent({
          userId: 'anonymous',
          eventType: AuditEventType.AUTHENTICATION_FAILED,
          details: { email },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'failure',
          requestId: req.headers['x-request-id'] as string
        });
        
        return next(new AppError('Invalid email or password', 401));
      }
      
      // Generate token
      const token = this.authService.generateToken(user);
      
      // Return user and token
      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            displayName: user.profile?.displayName,
          },
          token
        }
      });
    } catch (err) {
      next(err);
    }
  };
  

  /**
   * Get authenticated user profile
   * @route GET /api/auth/profile
   */
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // User will be attached to request by auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        return next(new AppError('Not authenticated', 401));
      }

      // Get user profile
      const user = await this.userService.findById(userId);
      
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Return user profile data
      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            profile: user.profile,
            stats: user.stats,
            settings: user.settings,
            metadata: {
              createdAt: user.metadata.createdAt,
              lastLogin: user.metadata.lastLogin
            }
          }
        }
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Change user password
   * @route POST /api/auth/change-password
   */
  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError('Not authenticated', 401));
      }

      // Verify current password and update to new password
      const updated = await this.authService.changePassword(userId, currentPassword, newPassword);
      
      if (!updated) {
        return next(new AppError('Current password is incorrect', 400));
      }

      res.status(200).json({
        status: 'success',
        message: 'Password updated successfully'
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Request password reset
   * @route POST /api/auth/forgot-password
   */
  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      if (!email) {
        return next(new AppError('Email is required', 400));
      }

      // Generate reset token and send email
      await this.authService.forgotPassword(email);

      // Always return success to prevent email enumeration
      res.status(200).json({
        status: 'success',
        message: 'If a user with that email exists, a reset link has been sent'
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Reset password with token
   * @route POST /api/auth/reset-password
   */
  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return next(new AppError('Token and new password are required', 400));
      }

      // Verify token and update password
      const resetSuccess = await this.authService.resetPassword(token, newPassword);
      
      if (resetSuccess == false) { // Explicitly check for failure
        return next(new AppError('Invalid or expired token', 400));
      }

      res.status(200).json({
        status: 'success',
        message: 'Password has been reset successfully'
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Refresh access token
   * @route POST /api/auth/refresh-token
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return next(new AppError('Refresh token is required', 400));
      }

      // Verify refresh token and generate new access token
      const result = await this.authService.refreshToken(refreshToken);
      
      if (!result) {
        return next(new AppError('Invalid or expired refresh token', 401));
      }

      res.status(200).json({
        status: 'success',
        data: {
          token: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Logout user
   * @route POST /api/auth/logout
   */
  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      
      // Invalidate refresh token if provided
      if (refreshToken) {
        await this.authService.invalidateRefreshToken(refreshToken);
      }

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
      });
    } catch (err) {
      next(err);
    }
  };
  /**
 * Verify user email with token
 * @route GET /api/users/verify-email/:token
 */
verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return next(new AppError('Token is required', 400));
    }
    
    const verified = await this.userService.verifyEmail(token);
    
    if (!verified) {
      return next(new AppError('Invalid or expired token', 400));
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Email successfully verified'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update user profile
 * @route PUT /api/users/me
 */
updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return next(new AppError('Not authenticated', 401));
    }
    
    // Update user profile
    const updatedUser = await this.userService.updateProfile(userId, req.body);
    
    if (!updatedUser) {
      return next(new AppError('Failed to update profile', 400));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          profile: updatedUser.profile
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update user settings
 * @route PUT /api/users/me/settings
 */
updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return next(new AppError('Not authenticated', 401));
    }
    
    // Update user settings
    const updatedUser = await this.userService.updateSettings(userId, req.body);
    
    if (!updatedUser) {
      return next(new AppError('Failed to update settings', 400));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        settings: updatedUser.settings
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Deactivate user account
 * @route DELETE /api/users/me
 */
deactivateAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return next(new AppError('Not authenticated', 401));
    }
    
    // Deactivate user account
    const deactivated = await this.userService.deactivateAccount(userId);
    
    if (!deactivated) {
      return next(new AppError('Failed to deactivate account', 400));
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Account successfully deactivated'
    });
  } catch (err) {
    next(err);
  }
};
}

export default new AuthController();