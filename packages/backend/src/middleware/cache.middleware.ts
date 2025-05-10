import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import config from '../config';

// Initialize Redis client
const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  // Enable TLS if using a secure connection (like Redis Cloud, AWS ElastiCache)
  ...(config.redis.tls && { tls: { rejectUnauthorized: false } }),
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Default expiration time for cached data (in seconds)
const DEFAULT_EXPIRATION = 3600; // 1 hour

/**
 * Middleware that caches API responses in Redis
 * @param expirationTime - Cache expiration time in seconds (optional, defaults to 1 hour)
 */
export const cacheMiddleware = (expirationTime = DEFAULT_EXPIRATION) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate a cache key based on the request URL and any query parameters
    const cacheKey = `cache:${req.originalUrl || req.url}`;

    try {
      // Check if the response is already cached
      const cachedResponse = await redisClient.get(cacheKey);

      if (cachedResponse) {
        // Return the cached response
        const parsedResponse = JSON.parse(cachedResponse);
        console.log(`Cache hit for: ${cacheKey}`);
        return res.status(200).json(parsedResponse);
      }
      
      // If not cached, intercept the response to cache it before sending
      const originalSend = res.send;
      res.send = function (body): Response {
        if (res.statusCode === 200) {
          // Only cache successful responses
          try {
            // Parse the response body if it's a string
            const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
            
            // Store in Redis with expiration
            redisClient.setex(
              cacheKey,
              expirationTime,
              JSON.stringify(responseBody)
            ).catch(err => console.error('Redis cache error:', err));
            
            console.log(`Cached response for: ${cacheKey}`);
          } catch (error) {
            console.error('Error caching response:', error);
          }
        }
        
        // Call the original send method
        return originalSend.call(this, body);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
};

/**
 * Invalidates cache for a specific route pattern
 * @param pattern - Route pattern to invalidate (e.g., '/api/exercises/*')
 */
export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    // Find all keys matching the pattern
    const keys = await redisClient.keys(`cache:${pattern}`);
    
    if (keys.length > 0) {
      // Delete all matching keys
      await redisClient.del(...keys);
      console.log(`Invalidated ${keys.length} cache entries for pattern: ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
    throw error;
  }
};

/**
 * Utility function to clear all cache entries
 */
export const clearAllCache = async (): Promise<void> => {
  try {
    // Find all cache keys
    const keys = await redisClient.keys('cache:*');
    
    if (keys.length > 0) {
      // Delete all cache keys
      await redisClient.del(...keys);
      console.log(`Cleared ${keys.length} cache entries`);
    }
  } catch (error) {
    console.error('Clear cache error:', error);
    throw error;
  }
};

export default {
  cacheMiddleware,
  invalidateCache,
  clearAllCache,
  redisClient, // Export client for direct access if needed
};