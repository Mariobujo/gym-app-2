// packages/backend/src/utils/jwt.utils.ts

import jwt from 'jsonwebtoken';
import { AppError } from './errors';
import config from '../config';

type TokenPayload = {
  id: string;
  role: string;
};

export const generateTokens = (payload: TokenPayload) => {
  // Usamos la definición de tipo explícita para evitar errores de TypeScript
  const accessToken = jwt.sign(
    payload as jwt.JwtPayload, 
    config.jwt.secret, 
    {
      expiresIn: config.jwt.accessTokenExpiry
    } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    payload as jwt.JwtPayload, 
    config.jwt.secret, 
    {
      expiresIn: config.jwt.refreshTokenExpiry
    } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string) => {
  try {
    const decoded = jwt.verify(
      token, 
      config.jwt.secret
    );
    return decoded as TokenPayload & { iat: number; exp: number };
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    const decoded = jwt.verify(
      token, 
      config.jwt.secret
    );
    return decoded as TokenPayload & { iat: number; exp: number };
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
};