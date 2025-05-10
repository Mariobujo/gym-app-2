// packages/backend/src/middleware/request-logger.middleware.ts

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware para logging detallado de solicitudes HTTP
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Asegurar que existe un ID de solicitud para correlación
  const requestId = req.headers['x-request-id'] as string || 
    `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  // Establecer ID de solicitud en headers
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  // Tiempo de inicio
  const start = Date.now();
  
  // Datos básicos para logging
  const logData = {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'] || 'unknown',
    userId: req.user?.id || 'anonymous'
  };
  
  // Log inicial
  logger.http(`Request: ${req.method} ${req.originalUrl}`, logData);
  
  // Interceptar finalización para logging
  res.on('finish', () => {
    // Tiempo total de procesamiento
    const duration = Date.now() - start;
    
    // Datos completos para el log
    const completeLogData = {
      ...logData,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.getHeader('content-length'),
      referrer: req.headers.referer || req.headers.referrer || '-'
    };
    
    // Nivel de log según código de estado
    if (res.statusCode >= 500) {
      logger.error(`Response: ${res.statusCode} ${req.method} ${req.originalUrl} - ${duration}ms`, completeLogData);
    } else if (res.statusCode >= 400) {
      logger.warn(`Response: ${res.statusCode} ${req.method} ${req.originalUrl} - ${duration}ms`, completeLogData);
    } else {
      logger.http(`Response: ${res.statusCode} ${req.method} ${req.originalUrl} - ${duration}ms`, completeLogData);
    }
  });
  
  // Continuar con la solicitud
  next();
};

export default requestLogger;