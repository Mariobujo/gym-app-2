// packages/backend/src/services/auth.service.ts

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import UserModel, { IUser } from '../models/user.model';
import { UserService } from './user.service';
import { AppError } from '../utils/errors';
import config from '../config';

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Interfaces para los tokens que faltan en el modelo de usuario
interface ResetToken {
  token: string;
  expiresAt: Date;
}

interface RefreshToken {
  token: string;
  expiresAt: Date;
}

export class AuthService {
  private userService: UserService;
  // Validez del token: 1 día
  private readonly JWT_EXPIRES_IN = '1d';
  // Validez del token de refresco: 7 días
  private readonly REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos
  // Tiempo de expiración del token de reinicio: 1 hora
  private readonly RESET_TOKEN_EXPIRES_IN = 60 * 60 * 1000; // 1 hora en milisegundos

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Generate JWT token for a user
   */
  generateToken(user: IUser): string {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role || 'user'
    };

    return jwt.sign(
      payload,
      config.jwt.secret,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<IUser | null> {
    // Find user with the given email
    const user = await this.userService.findByEmail(email);
    
    if (!user) {
      return null;
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Get user
      const user = await this.userService.findById(userId);
      
      if (!user) {
        return false;
      }

      // Verify current password
      const isValidPassword = await user.comparePassword(currentPassword);
      
      if (!isValidPassword) {
        return false;
      }

      // Update password - using the method directly from model
      user.password = newPassword;
      await user.save(); // This will trigger the pre-save hook to hash the password
      
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  }

  /**
   * Generate and store a password reset token
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      // Find user with email
      const user = await this.userService.findByEmail(email);
      
      if (!user) {
        return; // Don't reveal if user exists or not
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Store reset token in database - use the fields that actually exist in the model
      user.metadata.resetPasswordToken = hashedResetToken;
      user.metadata.resetPasswordExpires = new Date(Date.now() + this.RESET_TOKEN_EXPIRES_IN);

      await user.save();

      // In a real application, here you would send an email with the reset link
      // For this example, we'll just log it
      console.log(`Reset token for ${email}: ${resetToken}`);
      console.log(`Reset link: https://yourdomain.com/reset-password?token=${resetToken}`);
    } catch (error) {
      console.error('Error in forgotPassword:', error);
    }
  }

  /**
   * Reset password using a token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      // Hash the provided token for comparison
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with this reset token and check if it's valid
      const user = await UserModel.findOne({
        'metadata.resetPasswordToken': hashedToken,
        'metadata.resetPasswordExpires': { $gt: new Date() }
      });

      if (!user) {
        return false;
      }

      // Update user's password and clear reset token
      user.password = newPassword; // This will be hashed by the pre-save hook
      user.metadata.resetPasswordToken = undefined;
      user.metadata.resetPasswordExpires = undefined;
      user.metadata.updatedAt = new Date();

      await user.save();
      return true;
    } catch (error) {
      console.error('Error in resetPassword:', error);
      return false;
    }
  }

  /**
   * Generate a refresh token
   */
  async generateRefreshToken(userId: string): Promise<string> {
    // Generate a random token
    const refreshToken = crypto.randomBytes(40).toString('hex');

    // Store refresh token in database
    // This is a simplified version - in production, you'd store this in a separate collection
    const user = await this.userService.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Since the user model does not have refreshTokens field, we should add it to devices array
    // or create a new field. For now, let's use a device with a special type for refresh tokens
    const tokenDevice = {
      deviceId: refreshToken,
      deviceType: 'refresh_token',
      lastLogin: new Date(Date.now() + this.REFRESH_TOKEN_EXPIRES_IN)
    };

    // Add new token to devices array
    user.devices.push(tokenDevice);

    // Clean up expired tokens - filter out expired refresh tokens
    user.devices = user.devices.filter(
      (device) => device.deviceType !== 'refresh_token' || device.lastLogin > new Date()
    );

    await user.save();
    return refreshToken;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse | null> {
    try {
      // Find user with this refresh token in devices array
      const user = await UserModel.findOne({
        'devices.deviceId': refreshToken,
        'devices.deviceType': 'refresh_token',
        'devices.lastLogin': { $gt: new Date() }
      });

      if (!user) {
        return null;
      }

      // Remove the used refresh token from devices
      user.devices = user.devices.filter(
        (device) => !(device.deviceId === refreshToken && device.deviceType === 'refresh_token')
      );

      // Generate new access token and refresh token
      const accessToken = this.generateToken(user);
      const newRefreshToken = await this.generateRefreshToken(user.id);

      await user.save();

      return {
        accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Invalidate a refresh token
   */
  async invalidateRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      // Find user with this refresh token and remove it
      const result = await UserModel.updateOne(
        { 'devices.deviceId': refreshToken, 'devices.deviceType': 'refresh_token' },
        { $pull: { devices: { deviceId: refreshToken, deviceType: 'refresh_token' } } }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error invalidating refresh token:', error);
      return false;
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();