import redisClient, { isRedisReady } from '../config/redis.js';

// In-memory fallback map if Redis is temporarily unreachable
const inMemoryStore = new Map();

// Periodic cleanup of expired in-memory keys
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of inMemoryStore.entries()) {
    if (record.expiresAt < now) {
      inMemoryStore.delete(key);
    }
  }
}, 60000).unref();

/**
 * Creates a rate limiter middleware backed by Redis with in-memory fallback.
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 mins)
 * @param {number} options.max - Max requests allowed per window (default: 10)
 * @param {string} options.message - Error message when rate limit is exceeded
 * @param {string} options.keyPrefix - Prefix for Redis keys
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 10,
  message = 'Too many authentication attempts. Please try again in 15 minutes.',
  keyPrefix = 'rl:auth',
} = {}) => {
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req, res, next) => {
    // Determine client IP (support proxy headers from Gateway)
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const normalizedIp = clientIp.replace(/:/g, '_');
    const key = `${keyPrefix}:${normalizedIp}`;

    try {
      if (isRedisReady()) {
        const currentCount = await redisClient.incr(key);

        if (currentCount === 1) {
          await redisClient.expire(key, windowSeconds);
        }

        const ttl = await redisClient.ttl(key);

        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - currentCount));

        if (currentCount > max) {
          res.setHeader('Retry-After', ttl > 0 ? ttl : windowSeconds);
          return res.status(429).json({
            success: false,
            message,
            retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
          });
        }

        return next();
      }
    } catch (redisError) {
      console.warn(`[RateLimiter] Redis error: ${redisError.message}. Using fallback store.`);
    }

    // In-memory fallback
    const now = Date.now();
    let record = inMemoryStore.get(key);

    if (!record || record.expiresAt < now) {
      record = { count: 1, expiresAt: now + windowMs };
      inMemoryStore.set(key, record);
    } else {
      record.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));

    if (record.count > max) {
      const remainingSeconds = Math.ceil((record.expiresAt - now) / 1000);
      res.setHeader('Retry-After', remainingSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: remainingSeconds,
      });
    }

    next();
  };
};

/**
 * Pre-configured rate limiter for sensitive authentication endpoints (10 requests / 15 min)
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  keyPrefix: 'rl:auth',
});
