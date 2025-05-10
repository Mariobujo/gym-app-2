// src/models/user.model.ts

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { UserRole, FitnessLevel, WeightUnit, HeightUnit } from '../types/enums';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profile: {
    displayName?: string;
    birthdate?: Date;
    gender?: string;
    weight?: number;
    weightUnit: WeightUnit;
    height?: number;
    heightUnit: HeightUnit;
    fitnessLevel: FitnessLevel;
    goals: string[];
    equipmentAvailable: string[];
    avatar?: string;
    bio?: string;
  };
  settings: {
    notifications: {
      workout: boolean;
      achievements: boolean;
      reminders: boolean;
      marketing: boolean;
    };
    privacy: {
      profileVisibility: string;
      progressVisibility: string;
      workoutVisibility: string;
    };
    preferences: {
      darkMode: boolean;
      language: string;
      units: string;
      workoutSettings: {
        countdownTime: number;
        restTimers: boolean;
        audioFeedback: boolean;
      }
    };
  };
  stats: {
    workoutsCompleted: number;
    totalWorkoutTime: number;
    totalCaloriesBurned: number;
    streakDays: number;
    lastWorkoutDate: Date;
    level: number;
    xp: number;
    achievements: number;
  };
  devices: Array<{
    deviceId: string;
    deviceType: string;
    notificationToken?: string;
    lastLogin: Date;
  }>;
  metadata: {
    emailVerified: boolean;
    verificationToken?: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER
  },
  profile: {
    displayName: {
      type: String,
      trim: true
    },
    birthdate: Date,
    gender: String,
    weight: Number,
    weightUnit: {
      type: String,
      enum: Object.values(WeightUnit),
      default: WeightUnit.KG
    },
    height: Number,
    heightUnit: {
      type: String,
      enum: Object.values(HeightUnit),
      default: HeightUnit.CM
    },
    fitnessLevel: {
      type: String,
      enum: Object.values(FitnessLevel),
      default: FitnessLevel.BEGINNER
    },
    goals: [{
      type: String,
      trim: true
    }],
    equipmentAvailable: [{
      type: String,
      trim: true
    }],
    avatar: String,
    bio: {
      type: String,
      maxlength: 500
    }
  },
  settings: {
    notifications: {
      workout: {
        type: Boolean,
        default: true
      },
      achievements: {
        type: Boolean,
        default: true
      },
      reminders: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public'
      },
      progressVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public'
      },
      workoutVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public'
      }
    },
    preferences: {
      darkMode: {
        type: Boolean,
        default: false
      },
      language: {
        type: String,
        default: 'en'
      },
      units: {
        type: String,
        enum: ['metric', 'imperial'],
        default: 'metric'
      },
      workoutSettings: {
        countdownTime: {
          type: Number,
          default: 3
        },
        restTimers: {
          type: Boolean,
          default: true
        },
        audioFeedback: {
          type: Boolean,
          default: true
        }
      }
    }
  },
  stats: {
    workoutsCompleted: {
      type: Number,
      default: 0
    },
    totalWorkoutTime: {
      type: Number,
      default: 0
    },
    totalCaloriesBurned: {
      type: Number,
      default: 0
    },
    streakDays: {
      type: Number,
      default: 0
    },
    lastWorkoutDate: Date,
    level: {
      type: Number,
      default: 1
    },
    xp: {
      type: Number,
      default: 0
    },
    achievements: {
      type: Number,
      default: 0
    }
  },
  devices: [{
    deviceId: String,
    deviceType: String,
    notificationToken: String,
    lastLogin: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    emailVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    active: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Pre-save hook to hash password
UserSchema.pre('save', async function(next) {
  const user = this as IUser;
  
  // Only hash the password if it has been modified or is new
  if (!user.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash password
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);