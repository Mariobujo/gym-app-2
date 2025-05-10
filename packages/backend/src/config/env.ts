// src/config/env.ts

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Server
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = process.env.PORT || 3000;

// MongoDB
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gym-app';

// JWT
export const JWT_SECRET = process.env.JWT_SECRET || 'my-ultra-secure-and-ultra-long-secret';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const JWT_COOKIE_EXPIRES_IN = process.env.JWT_COOKIE_EXPIRES_IN || 7;

// Email
export const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.mailtrap.io';
export const EMAIL_PORT = process.env.EMAIL_PORT || 2525;
export const EMAIL_USER = process.env.EMAIL_USER || '';
export const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || '';
export const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@gymapp.com';

// Frontend URL
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Redis
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// AWS S3
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || '';
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
export const AWS_REGION = process.env.AWS_REGION || 'us-east-1';