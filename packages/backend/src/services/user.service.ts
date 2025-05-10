// packages/backend/src/services/user.service.ts

import UserModel, { IUser } from '../models/user.model';
import { AppError } from '../utils/errors';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';

export class UserService {
  /**
   * Find a user by their ID
   */
  async findById(id: string): Promise<IUser | null> {
    try {
      return await UserModel.findById(id);
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  /**
   * Find a user by their email address
   */
  async findByEmail(email: string): Promise<IUser | null> {
    try {
      return await UserModel.findOne({ email: email.toLowerCase() });
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: any): Promise<IUser> {
    try {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Prepare user data
      const newUserData = {
        email: userData.email.toLowerCase(),
        passwordHash: hashedPassword,
        profile: {
          ...userData.profile,
          displayName: userData.profile.displayName || `${userData.profile.firstName} ${userData.profile.lastName}`
        },
        settings: userData.settings || {},
        stats: {
          workoutsCompleted: 0,
          totalWorkoutTime: 0,
          totalCaloriesBurned: 0,
          streakDays: 0,
          lastWorkoutDate: null,
          level: 1,
          xp: 0,
          achievements: 0
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date(),
          active: true,
          verified: false
        }
      };

      // Create and save user
      const user = new UserModel(newUserData);
      await user.save();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new AppError('Failed to create user', 500);
    }
  }

  /**
   * Update a user's profile information
   */
  async updateProfile(userId: string, profileData: any): Promise<IUser | null> {
    try {
      const user = await UserModel.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Update profile fields
      user.profile = {
        ...user.profile,
        ...profileData
      };
      
      user.metadata.updatedAt = new Date();
      
      await user.save();
      return user;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new AppError('Failed to update profile', 500);
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(userId: string, settingsData: any): Promise<IUser | null> {
    try {
      const user = await UserModel.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Deep merge settings
      user.settings = this.mergeSettings(user.settings, settingsData);
      user.metadata.updatedAt = new Date();
      
      await user.save();
      return user;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw new AppError('Failed to update settings', 500);
    }
  }

  /**
   * Helper function to merge settings objects
   */
  private mergeSettings(currentSettings: any, newSettings: any): any {
    const result = { ...currentSettings };
    
    for (const key in newSettings) {
      if (typeof newSettings[key] === 'object' && !Array.isArray(newSettings[key])) {
        result[key] = this.mergeSettings(result[key] || {}, newSettings[key]);
      } else {
        result[key] = newSettings[key];
      }
    }
    
    return result;
  }

  /**
   * Update password for a user
   */
  async updatePassword(userId: string, hashedPassword: string): Promise<boolean> {
    try {
      const result = await UserModel.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            passwordHash: hashedPassword,
            'metadata.updatedAt': new Date()
          } 
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating password:', error);
      throw new AppError('Failed to update password', 500);
    }
  }

  /**
   * Update the last login date for a user
   */
  async updateLastLogin(userId: string): Promise<boolean> {
    try {
      const now = new Date();
      const result = await UserModel.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            'metadata.lastLogin': now,
            'metadata.updatedAt': now
          } 
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating last login:', error);
      return false;
    }
  }

  /**
   * Update user statistics
   */
  async updateStats(userId: string, statsData: any): Promise<IUser | null> {
    try {
      const user = await UserModel.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Update stats fields
      user.stats = {
        ...user.stats,
        ...statsData
      };
      
      user.metadata.updatedAt = new Date();
      
      await user.save();
      return user;
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw new AppError('Failed to update stats', 500);
    }
  }

  /**
   * Deactivate a user account
   */
  async deactivateAccount(userId: string): Promise<boolean> {
    try {
      const result = await UserModel.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            'metadata.active': false,
            'metadata.updatedAt': new Date()
          } 
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error deactivating account:', error);
      throw new AppError('Failed to deactivate account', 500);
    }
  }

  /**
   * Delete a user account permanently
   * Note: In production, consider soft delete instead
   */
  async deleteAccount(userId: string): Promise<boolean> {
    try {
      const result = await UserModel.deleteOne({ _id: new ObjectId(userId) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new AppError('Failed to delete account', 500);
    }
  }

  /**
   * Verify a user's email address
   */
  async verifyEmail(userId: string): Promise<boolean> {
    try {
      const result = await UserModel.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            'metadata.verified': true,
            'metadata.updatedAt': new Date()
          } 
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error verifying email:', error);
      throw new AppError('Failed to verify email', 500);
    }
  }
}

export default new UserService();