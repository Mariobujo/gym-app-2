// packages/backend/src/middleware/sanitize.middleware.ts

import { Request, Response, NextFunction } from 'express';
import xss from 'xss';
import mongoSanitize from 'express-mongo-sanitize';

/**
 * Sanitiza los datos del cuerpo de la solicitud para prevenir XSS
 */
export const sanitizeBody = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) {
    const sanitized = sanitizeObject(req.body);
    req.body = sanitized;
  }
  next();
};

/**
 * Sanitiza un objeto recursivamente
 */
const sanitizeObject = (obj: any): any => {
  const result: any = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Sanitizar valores de cadena
        result[key] = xss(value);
      } else if (Array.isArray(value)) {
        // Sanitizar arrays
        result[key] = value.map(item => 
          typeof item === 'object' && item !== null
            ? sanitizeObject(item)
            : typeof item === 'string'
              ? xss(item)
              : item
        );
      } else if (typeof value === 'object' && value !== null) {
        // Recursivamente sanitizar objetos anidados
        result[key] = sanitizeObject(value);
      } else {
        // Mantener otros tipos de valores intactos
        result[key] = value;
      }
    }
  }
  
  return result;
};

/**
 * Middleware de express-mongo-sanitize
 * Elimina caracteres como $ y . para evitar inyección NoSQL
 */
// @ts-ignore - Ignorar errores de tipo para mongoSanitize
export const mongoSanitizer = mongoSanitize();

export default {
  sanitizeBody,
  mongoSanitizer
};