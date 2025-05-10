// Extender la interfaz Request para incluir propiedades custom
declare global {
  namespace Express {
    interface Request {
      user?: any;
      resource?: any;
    }
  }
}// packages/backend/src/middleware/authorize.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { AppError, forbiddenError } from '../utils/errors';
import { UserRole } from '../types/enums';
import auditService, { AuditEventType } from '../services/audit.service';

// Definir permisos para cada rol
const ROLE_PERMISSIONS: Record<string, string[]> = {
  [UserRole.ADMIN]: [
    'user:read', 'user:write', 'user:delete',
    'exercise:read', 'exercise:write', 'exercise:delete',
    'routine:read', 'routine:write', 'routine:delete',
    'progress:read', 'progress:write', 'progress:delete',
    'workout:read', 'workout:write', 'workout:delete',
    'media:read', 'media:write', 'media:delete',
    'admin:access'
  ],
  [UserRole.USER]: [
    'exercise:read',
    'routine:read', 'routine:write', // Solo rutinas propias
    'progress:read', 'progress:write', // Solo progreso propio
    'workout:read', 'workout:write', // Solo entrenamientos propios
    'media:read'
  ],
  [UserRole.SUPER_ADMIN]: [
    'user:read', 'user:write', 'user:delete',
    'exercise:read', 'exercise:write', 'exercise:delete',
    'routine:read', 'routine:write', 'routine:delete',
    'progress:read', 'progress:write', 'progress:delete',
    'workout:read', 'workout:write', 'workout:delete',
    'media:read', 'media:write', 'media:delete',
    'admin:access', 'system:read', 'system:write', 'system:delete'
  ]
};

// Definir roles adicionales que no están en el enum
const TRAINER_ROLE = 'TRAINER';
const GUEST_ROLE = 'GUEST';

// Añadir roles adicionales a ROLE_PERMISSIONS
ROLE_PERMISSIONS[TRAINER_ROLE] = [
  'user:read',
  'exercise:read', 'exercise:write',
  'routine:read', 'routine:write',
  'progress:read',
  'workout:read',
  'media:read', 'media:write'
];

ROLE_PERMISSIONS[GUEST_ROLE] = [
  'exercise:read',
  'routine:read' // Solo rutinas públicas
];

/**
 * Middleware para restringir acceso a roles específicos
 */
export const restrictTo = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verificar que usuario existe en req
      if (!req.user || !req.user.role) {
        // Auditar intento de acceso sin autenticación
        await auditService.logEvent({
          userId: req.user?.id || 'anonymous',
          eventType: AuditEventType.PERMISSION_DENIED,
          resourceType: req.baseUrl.split('/').pop() || 'unknown',
          resourceId: req.params.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'failure',
          details: {
            method: req.method,
            path: req.originalUrl,
            reason: 'No authentication'
          }
        });
        
        return next(new AppError('No estás autenticado', 401));
      }
      
      // Verificar que rol del usuario está entre los permitidos
      if (!roles.includes(req.user.role)) {
        // Auditar intento de acceso con rol insuficiente
        await auditService.logEvent({
          userId: req.user.id,
          eventType: AuditEventType.PERMISSION_DENIED,
          resourceType: req.baseUrl.split('/').pop() || 'unknown',
          resourceId: req.params.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'failure',
          details: {
            method: req.method,
            path: req.originalUrl,
            userRole: req.user.role,
            requiredRoles: roles,
            reason: 'Insufficient role'
          }
        });
        
        return next(new AppError('No tienes permiso para realizar esta acción', 403));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar permiso específico
 */
export const hasPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verificar que usuario existe en req
      if (!req.user || !req.user.role) {
        // Auditar intento de acceso sin autenticación
        await auditService.logEvent({
          userId: req.user?.id || 'anonymous',
          eventType: AuditEventType.PERMISSION_DENIED,
          resourceType: req.baseUrl.split('/').pop() || 'unknown',
          resourceId: req.params.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'failure',
          details: {
            method: req.method,
            path: req.originalUrl,
            permission,
            reason: 'No authentication'
          }
        });
        
        return next(new AppError('No estás autenticado', 401));
      }
      
      // Obtener rol del usuario
      const userRole = req.user.role;
      
      // Verificar que el usuario tiene el permiso requerido
      const userPermissions = ROLE_PERMISSIONS[userRole] || [];
      
      if (!userPermissions.includes(permission)) {
        // Auditar intento de acceso con permiso insuficiente
        await auditService.logEvent({
          userId: req.user.id,
          eventType: AuditEventType.PERMISSION_DENIED,
          resourceType: req.baseUrl.split('/').pop() || 'unknown',
          resourceId: req.params.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'failure',
          details: {
            method: req.method,
            path: req.originalUrl,
            userRole,
            requiredPermission: permission,
            reason: 'Insufficient permission'
          }
        });
        
        return next(new AppError('No tienes permiso para realizar esta acción', 403));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar propiedad de un recurso
 */
export const isResourceOwner = (model: any, userField = 'user') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verificar que usuario existe en req
      if (!req.user || !req.user.id) {
        return next(new AppError('No estás autenticado', 401));
      }
      
      // Admins y trainers pueden acceder a cualquier recurso
      if (req.user.role === UserRole.ADMIN || req.user.role === TRAINER_ROLE) {
        return next();
      }
      
      // Obtener ID de recurso
      const resourceId = req.params.id;
      
      if (!resourceId) {
        return next(new AppError('ID de recurso no proporcionado', 400));
      }
      
      // Buscar el recurso
      const resource = await model.findById(resourceId);
      
      if (!resource) {
        return next(new AppError('Recurso no encontrado', 404));
      }
      
      // Verificar propiedad
      if (!resource[userField] || resource[userField].toString() !== req.user.id.toString()) {
        // Auditar intento de acceso a recurso que no pertenece al usuario
        await auditService.logEvent({
          userId: req.user.id,
          eventType: AuditEventType.PERMISSION_DENIED,
          resourceType: model.modelName.toLowerCase(),
          resourceId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'failure',
          details: {
            method: req.method,
            path: req.originalUrl,
            reason: 'Not resource owner',
            resourceOwner: resource[userField]?.toString()
          }
        });
        
        return next(new AppError('No tienes permiso para acceder a este recurso', 403));
      }
      
      // Añadir recurso a la request para evitar múltiples consultas
      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default {
  restrictTo,
  hasPermission,
  isResourceOwner,
  ROLE_PERMISSIONS
};