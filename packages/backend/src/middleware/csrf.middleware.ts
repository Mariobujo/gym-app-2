// packages/backend/src/middleware/csrf.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import config from '../config';

/**
 * Middleware para protección CSRF para APIs basadas en token
 * Para APIs REST que usan tokens JWT, la protección CSRF se basa en verificar 
 * el origin y/o el referer de las solicitudes que modifican datos
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Solo aplicar protección a métodos que modifican datos
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    // Configurar orígenes permitidos
    const allowedOrigins = config.cors?.allowedOrigins || [];
    
    // En desarrollo, permitir localhost
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(
        'http://localhost:3000', 
        'http://localhost:19006', 
        'http://localhost:19000', 
        'http://localhost:19001', 
        'http://localhost:19002'
      );
    }

    const origin = req.headers.origin;
    const referer = req.headers.referer;

    // Las solicitudes sin origin o referer vienen del mismo origen, permitirlas
    if (!origin && !referer) {
      return next();
    }

    // Validar origin y referer
    const hasValidOrigin = origin && allowedOrigins.includes(origin as string);
    const hasValidReferer = referer && allowedOrigins.some((allowed: string) => referer.startsWith(allowed));

    if (!hasValidOrigin && !hasValidReferer) {
      return next(new AppError('CSRF validation failed', 403));
    }
  }

  next();
};

export default csrfProtection;