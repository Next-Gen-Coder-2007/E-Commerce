import redisClient, { isRedisReady } from '../config/redis.js';

const inMemoryStore = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of inMemoryStore.entries()) {
    if (record.expiresAt < now) {
      inMemoryStore.delete(key);
    }
  }
}, 60000).unref();

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 10,
  message = 'Too many authentication attempts. Please try again in 15 minutes.',
  keyPrefix = 'rl:auth',
} = {}) => {
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req, res, next) => {
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

const isDev = process.env.NODE_ENV !== 'production';

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 15,
  message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  keyPrefix: 'rl:auth',
});
