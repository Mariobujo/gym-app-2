// src/models/exercise.model.ts

import mongoose, { Document, Schema } from 'mongoose';
import { 
  ExerciseType, 
  ExerciseMechanic, 
  ExerciseForce, 
  ExerciseEquipment, 
  MuscleGroup 
} from '../types/enums';

export interface IExercise extends Document {
  name: string;
  description: string;
  instructions: string[];
  type: ExerciseType;
  mechanics: ExerciseMechanic;
  equipment: ExerciseEquipment[];
  difficultyLevel: number;
  muscleGroups: {
    primary: MuscleGroup[];
    secondary: MuscleGroup[];
  };
  metrics: {
    force: ExerciseForce;
    level: string;
    weightType: string;
  };
  media: {
    gifUrl?: string;
    thumbnailUrl?: string;
    videoUrl?: string;
    images?: string[];
  };
  variations?: mongoose.Types.ObjectId[];
  alternatives?: mongoose.Types.ObjectId[];
  metadata: {
    popularity: number;
    rating: number;
    createdBy: string | mongoose.Types.ObjectId;
    public: boolean;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
  };
}

const ExerciseSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  instructions: [{
    type: String,
    required: true,
    trim: true
  }],
  type: {
    type: String,
    enum: Object.values(ExerciseType),
    required: true
  },
  mechanics: {
    type: String,
    enum: Object.values(ExerciseMechanic),
    required: true
  },
  equipment: [{
    type: String,
    enum: Object.values(ExerciseEquipment),
    required: true
  }],
  difficultyLevel: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  muscleGroups: {
    primary: [{
      type: String,
      enum: Object.values(MuscleGroup),
      required: true
    }],
    secondary: [{
      type: String,
      enum: Object.values(MuscleGroup)
    }]
  },
  metrics: {
    force: {
      type: String,
      enum: Object.values(ExerciseForce),
      required: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true
    },
    weightType: {
      type: String,
      enum: ['bodyweight', 'weighted', 'assisted', 'machine'],
      required: true
    }
  },
  media: {
    gifUrl: String,
    thumbnailUrl: String,
    videoUrl: String,
    images: [String]
  },
  variations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise'
  }],
  alternatives: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise'
  }],
  metadata: {
    popularity: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    createdBy: {
      type: String,
      default: 'system'
    },
    public: {
      type: Boolean,
      default: true
    },
    tags: [{
      type: String,
      trim: true
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create text index for search functionality
ExerciseSchema.index({ 
  name: 'text', 
  description: 'text', 
  'metadata.tags': 'text' 
}, {
  weights: {
    name: 10,
    'metadata.tags': 5,
    description: 3
  }
});

// Create compound index for filtering
ExerciseSchema.index({ 
  type: 1, 
  'muscleGroups.primary': 1, 
  equipment: 1,
  difficultyLevel: 1
});

export default mongoose.model<IExercise>('Exercise', ExerciseSchema);