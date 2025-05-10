// packages/backend/src/app.ts (actualizado)

import express from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { NODE_ENV } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import { NotFoundError } from './utils/errors';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import exerciseRoutes from './routes/exercise.routes';
import routineRoutes from './routes/routine.routes';
import workoutRoutes from './routes/workout.routes';
import progressRoutes from './routes/progress.routes';
import { v4 as uuidv4 } from 'uuid';


// Importar middlewares de seguridad
import sanitize from './middleware/sanitize.middleware';
import rateLimit from './middleware/rateLimit.middleware';
import csrfProtection from './middleware/csrf.middleware';
import requestLogger from './middleware/request-logger.middleware';

const app = express();

// Request ID para correlación y trazabilidad
app.use((req, res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
  next();
});

// Aplica los middleware en orden correcto
app.use(helmet()); 

// Logging y tracking de solicitudes
app.use(requestLogger);

// Rate limiting
app.use('/api/v1/auth', rateLimit.authLimiter);
app.use('/api/v1', rateLimit.standardLimiter);

// Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Seguridad - usando ts-ignore para bypasear errores de tipo
// @ts-ignore - Ignorar errores de tipo para sanitizeBody
app.use(sanitize.sanitizeBody);

// @ts-ignore - Ignorar errores de tipo para mongoSanitizer
app.use(sanitize.mongoSanitizer);

app.use(csrfProtection);

// Configuración de headers de seguridad con Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Considerar restringir más en producción
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    }
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' }
}));

// Logging en desarrollo
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// CORS configurado
app.use(cors({
  origin: process.env.CORS_ALLOWED_ORIGINS ? 
    process.env.CORS_ALLOWED_ORIGINS.split(',') : 
    (NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:19006'] : true),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  credentials: true,
  maxAge: 86400 // 24 horas
}));

// Rate limiters para protección contra ataques de fuerza bruta y DoS
app.use('/api/v1/auth/login', rateLimit.authLimiter);
app.use('/api/v1/auth/register', rateLimit.authLimiter);
app.use('/api/v1/auth/forgot-password', rateLimit.authLimiter);
app.use('/api/v1/auth/reset-password', rateLimit.authLimiter);
app.use('/api/v1/auth/refresh-token', rateLimit.authLimiter);
app.use('/api/v1/users', rateLimit.standardLimiter);

// @ts-ignore - Ignorar errores de tipo para el middleware de compresión
app.use(compression());

// Rutas API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/exercises', exerciseRoutes);
app.use('/api/v1/routines', routineRoutes);
app.use('/api/v1/workouts', workoutRoutes);
app.use('/api/v1/progress', progressRoutes);

// Servir archivos estáticos de manera segura
// Prefiere usar nginx o un CDN en producción
app.use('/uploads', (req, res, next) => {
  // Verificar extensiones permitidas para evitar ataques de exposición de archivos
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];
  const ext = path.extname(req.path).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    return next(new NotFoundError('Archivo no encontrado'));
  }
  
  // Permitir solo métodos GET para archivos estáticos
  if (req.method !== 'GET') {
    return next(new NotFoundError('Método no permitido'));
  }
  
  next();
}, express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d',
  setHeaders: (res) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// Handler para rutas no encontradas
app.use('*', (req, res, next) => {
  next(new NotFoundError(`No se encontró ${req.originalUrl} en este servidor`));
});

// Manejador global de errores
app.use(errorHandler);

export default app;