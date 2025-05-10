// packages/backend/src/middleware/rateLimit.middleware.ts

import rateLimit, { Store, LegacyStore, Options } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Redis } from 'ioredis';
import config from '../config';

// Cliente Redis
let redisClient: Redis | null = null;

// Inicializar cliente Redis si está configurado
if (config.redis && config.redis.host) {
  try {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      tls: config.redis.tls ? { rejectUnauthorized: false } : undefined
    });

    redisClient.on('error', (err: Error) => {
      console.error('Redis rate limit client error:', err);
      // Fallar silenciosamente, usaremos memory store como respaldo
      redisClient = null;
    });
  } catch (err: unknown) {
    console.error('Error connecting to Redis for rate limiting:', err);
    redisClient = null;
  }
}

// Store factory para rate limiting
const getStore = (): Store | LegacyStore | undefined => {
  if (redisClient) {
    // Variable para almacenar las opciones de configuración
    let storeOptions: Options;
    
    // Crear un store compatible
    return {
      init: (options: Options): void => {
        // Guardar las opciones para usar en otros métodos
        storeOptions = options;
      },
      increment: (key: string): Promise<{ totalHits: number, resetTime: Date }> => {
        const now = Date.now();
        const resetTime = new Date(now + storeOptions.windowMs);
        return redisClient!.incr(key)
          .then((totalHits) => {
            redisClient!.pexpire(key, storeOptions.windowMs);
            return { totalHits: Number(totalHits), resetTime };
          });
      },
      decrement: (key: string): Promise<void> => {
        return redisClient!.decr(key).then(() => {});
      },
      resetKey: (key: string): Promise<void> => {
        return redisClient!.del(key).then(() => {});
      }
    } as Store;
  }
  
  // Si no hay Redis, usar memoria (no recomendado para producción con múltiples nodos)
  console.warn('Using memory store for rate limiting. Not recommended for production with multiple nodes');
  return undefined; // Express-rate-limit usará memory store por defecto
};

// Configurar limitadores
const limiterSettings = {
  // Limiter para rutas generales
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 solicitudes por ventana por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 'error',
      message: 'Too many requests from this IP, please try again later'
    }
  },
  
  // Limiter para endpoints de autenticación
  auth: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // 10 intentos por hora
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 'error',
      message: 'Too many login attempts. Please try again later'
    }
  },
  
  // Limiter para APIs sensibles (ej. usuarios, pagos)
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 30, // 30 solicitudes por hora
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 'error',
      message: 'Rate limit exceeded for sensitive operations'
    }
  }
};

// Crear limitadores con Redis store si está disponible
export const standardLimiter = rateLimit({
  ...limiterSettings.standard,
  store: getStore()
});

export const authLimiter = rateLimit({
  ...limiterSettings.auth,
  store: getStore()
});

export const sensitiveLimiter = rateLimit({
  ...limiterSettings.sensitive,
  store: getStore()
});

export default {
  standardLimiter,
  authLimiter,
  sensitiveLimiter
};