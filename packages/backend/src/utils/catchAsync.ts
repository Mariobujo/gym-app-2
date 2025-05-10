// src/utils/catchAsync.ts

import { Request, Response, NextFunction } from 'express';

/**
 * Envuelve una función de controlador para capturar errores asíncronos y pasarlos a Express
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};