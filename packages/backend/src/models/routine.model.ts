// src/models/routine.model.ts

import mongoose, { Document, Schema } from 'mongoose';
import { MuscleGroup, ExerciseEquipment } from '../types/enums';

interface IRoutineExerciseSet {
  type: string; // 'normal', 'warmup', 'dropset', 'superset'
  reps: {
    count: number;
    type: string; // 'reps', 'time', 'failure'
  };
  weight: {
    value: number;
    unit: string; // 'kg', 'lb', 'bodyweight', '%1RM'
    calculation: string; // 'fixed', 'percentage', 'rpe'
  };
  rest: number; // seconds
  tempo?: string; // e.g. "3-1-2-0" (eccentric-bottom-concentric-top)
}

interface IRoutineExercise {
  exerciseId: mongoose.Types.ObjectId;
  order: number;
  sets: IRoutineExerciseSet[];
  notes?: string;
  supersetWith?: mongoose.Types.ObjectId[];
}

interface IRoutineWarmup {
  exerciseId: mongoose.Types.ObjectId;
  duration: number;
  sets: number;
  reps: number;
}

interface IRoutineCooldown {
  exerciseId: mongoose.Types.ObjectId;
  duration: number;
  sets: number;
  reps: number;
}

interface IRoutineProgression {
  type: string; // 'linear', 'undulating', 'percentage'
  parameters: any;
}

interface IRoutineMetrics {
  estimatedCalories: number;
  difficulty: number; // 1-5
  tags: string[];
  visibility: string; // 'public', 'private', 'friends'
  featured: boolean;
  rating: number;
  ratingCount: number;
  usedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoutine extends Document {
  name: string;
  description: string;
  objective: string; // 'strength', 'hypertrophy', 'endurance', 'weight_loss', etc.
  level: string; // 'beginner', 'intermediate', 'advanced'
  creator: {
    type: string; // 'system', 'user'
    id: mongoose.Types.ObjectId | null;
  };
  duration: {
    estimated: number; // minutes
    rest: number; // total seconds of rest
  };
  schedule: number[]; // Days of the week (0-6)
  frequency: number; // Times per week
  exercises: IRoutineExercise[];
  warmup?: IRoutineWarmup[];
  cooldown?: IRoutineCooldown[];
  progression?: IRoutineProgression;
  equipment: ExerciseEquipment[];
  muscleGroups: {
    primary: MuscleGroup[];
    secondary: MuscleGroup[];
  };
  metadata: IRoutineMetrics;
}

const RoutineExerciseSetSchema = new Schema({
  type: {
    type: String,
    enum: ['normal', 'warmup', 'dropset', 'superset'],
    default: 'normal'
  },
  reps: {
    count: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['reps', 'time', 'failure'],
      default: 'reps'
    }
  },
  weight: {
    value: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      enum: ['kg', 'lb', 'bodyweight', '%1RM'],
      default: 'kg'
    },
    calculation: {
      type: String,
      enum: ['fixed', 'percentage', 'rpe'],
      default: 'fixed'
    }
  },
  rest: {
    type: Number,
    default: 60
  },
  tempo: String
});

const RoutineExerciseSchema = new Schema({
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  sets: [RoutineExerciseSetSchema],
  notes: String,
  supersetWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise'
  }]
});

const RoutineWarmupSchema = new Schema({
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  duration: {
    type: Number,
    default: 5
  },
  sets: {
    type: Number,
    default: 1
  },
  reps: {
    type: Number,
    default: 10
  }
});

const RoutineCooldownSchema = new Schema({
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  duration: {
    type: Number,
    default: 5
  },
  sets: {
    type: Number,
    default: 1
  },
  reps: {
    type: Number,
    default: 10
  }
});

const RoutineSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  objective: {
    type: String,
    required: true,
    enum: ['strength', 'hypertrophy', 'endurance', 'weight_loss', 'general_fitness', 'mobility', 'sport_specific']
  },
  level: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  creator: {
    type: {
      type: String,
      enum: ['system', 'user'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  duration: {
    estimated: {
      type: Number,
      required: true
    },
    rest: {
      type: Number,
      default: 0
    }
  },
  schedule: [{
    type: Number,
    min: 0,
    max: 6
  }],
  frequency: {
    type: Number,
    min: 1,
    max: 7,
    default: 3
  },
  exercises: [RoutineExerciseSchema],
  warmup: [RoutineWarmupSchema],
  cooldown: [RoutineCooldownSchema],
  progression: {
    type: {
      type: String,
      enum: ['linear', 'undulating', 'percentage'],
      default: 'linear'
    },
    parameters: {
      type: Schema.Types.Mixed
    }
  },
  equipment: [{
    type: String,
    enum: Object.values(ExerciseEquipment)
  }],
  muscleGroups: {
    primary: [{
      type: String,
      enum: Object.values(MuscleGroup)
    }],
    secondary: [{
      type: String,
      enum: Object.values(MuscleGroup)
    }]
  },
  metadata: {
    estimatedCalories: {
      type: Number,
      default: 0
    },
    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    tags: [{
      type: String,
      trim: true
    }],
    visibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'private'
    },
    featured: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    ratingCount: {
      type: Number,
      default: 0
    },
    usedCount: {
      type: Number,
      default: 0
    },
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

// Create indexes for common queries
RoutineSchema.index({ 'creator.id': 1, 'metadata.visibility': 1 });
RoutineSchema.index({ objective: 1, level: 1, 'metadata.rating': -1 });
RoutineSchema.index({ 'metadata.tags': 1 });
RoutineSchema.index({ 'muscleGroups.primary': 1 });
RoutineSchema.index({ equipment: 1 });

// Text index for search
RoutineSchema.index({ 
  name: 'text', 
  description: 'text', 
  'metadata.tags': 'text' 
}, {
  weights: {
    name: 10,
    description: 5,
    'metadata.tags': 3
  }
});

// Virtual for populating exercise details
RoutineSchema.virtual('exerciseDetails', {
  ref: 'Exercise',
  localField: 'exercises.exerciseId',
  foreignField: '_id'
});

export default mongoose.model<IRoutine>('Routine', RoutineSchema);