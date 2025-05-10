// packages/backend/src/models/audit.model.ts

import mongoose, { Document, Schema } from 'mongoose';

// Tipos de eventos para auditoría
export enum AuditEventType {
  USER_REGISTER = 'USER_REGISTER',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_UPDATE = 'USER_UPDATE',
  USER_PASSWORD_CHANGE = 'USER_PASSWORD_CHANGE',
  USER_PASSWORD_RESET = 'USER_PASSWORD_RESET',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  
  RESOURCE_CREATE = 'RESOURCE_CREATE',
  RESOURCE_READ = 'RESOURCE_READ',
  RESOURCE_UPDATE = 'RESOURCE_UPDATE',
  RESOURCE_DELETE = 'RESOURCE_DELETE',
  
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  
  EXERCISE_CREATED = 'EXERCISE_CREATED',
  EXERCISE_UPDATED = 'EXERCISE_UPDATED',
  EXERCISE_DELETED = 'EXERCISE_DELETED',
  
  ROUTINE_CREATED = 'ROUTINE_CREATED',
  ROUTINE_UPDATED = 'ROUTINE_UPDATED',
  ROUTINE_DELETED = 'ROUTINE_DELETED',
  
  WORKOUT_STARTED = 'WORKOUT_STARTED',
  WORKOUT_COMPLETED = 'WORKOUT_COMPLETED',
  WORKOUT_CANCELED = 'WORKOUT_CANCELED',
  
  PROGRESS_RECORDED = 'PROGRESS_RECORDED',
  RECORD_ACHIEVED = 'RECORD_ACHIEVED',
  
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DELETE = 'FILE_DELETE',
  EXPORT_DATA = 'EXPORT_DATA',
  
  ADMIN_ACTION = 'ADMIN_ACTION'
}

// Interface para el modelo de auditoría
export interface IAudit extends Document {
  timestamp: Date;
  userId: string;
  eventType: AuditEventType;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  requestId?: string;
}

// Esquema de auditoría
const AuditSchema: Schema = new Schema({
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: Object.values(AuditEventType),
    index: true
  },
  resourceType: {
    type: String,
    index: true
  },
  resourceId: {
    type: String,
    index: true
  },
  details: {
    type: Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success',
    index: true
  },
  requestId: {
    type: String,
    index: true
  }
}, {
  versionKey: false,
  timestamps: false
});

// TTL index para expirar registros antiguos (opcional)
// AuditSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 }); // 1 año

// Índices adicionales
AuditSchema.index({ userId: 1, eventType: 1 });
AuditSchema.index({ eventType: 1, timestamp: -1 });
AuditSchema.index({ timestamp: -1, status: 1 });

const AuditModel = mongoose.model<IAudit>('Audit', AuditSchema);

export default AuditModel;