// packages/backend/src/middleware/audit.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import auditService, { AuditEventType } from '../services/audit.service';

/**
 * Middleware para auditar acceso a rutas sensibles
 * @param eventType - Tipo de evento a registrar
 * @param resourceType - Tipo de recurso (opcional)
 */
export const auditRoute = (eventType: AuditEventType, resourceType?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Generar ID de solicitud única para correlación
      const requestId = req.headers['x-request-id'] as string || uuidv4();
      req.headers['x-request-id'] = requestId;
      
      // Esperar hasta next para poder capturar el resultado del manejo de la solicitud
      // res.on('finish') nos permitirá conocer el código de estado de la respuesta
      
      // Preparar datos base para auditoría
      const auditData = {
        userId: req.user?.id || 'anonymous',
        eventType,
        resourceType,
        resourceId: req.params.id, // Capturar ID de recurso desde parámetros si existe
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId
      };
      
      // Respuesta original
      const originalSend = res.send;
      
      // Sobrescribir método send para capturar y auditar al final
      res.send = function(...args) {
        // Determinar si es éxito o fallo basado en código de estado
        const status = res.statusCode >= 400 ? 'failure' : 'success';
        
        // Registrar evento asíncronamente (no bloquear respuesta)
        auditService.logEvent({
          ...auditData,
          status,
          // Añadir detalles según el tipo de evento
          details: {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            ...(eventType === AuditEventType.AUTHENTICATION_FAILED && { 
              email: (req.body.email || 'unknown').toString() 
            }),
            ...(req.params.id && { 
              resourceId: req.params.id 
            })
          }
        }).catch(err => {
          console.error('Error logging audit event:', err);
        });
        
        // Llamar al send original
        return originalSend.apply(res, args);
      };
      
      next();
    } catch (error) {
      // En caso de error en el middleware, continuar sin bloquear
      console.error('Error in audit middleware:', error);
      next();
    }
  };
};

export default { auditRoute };