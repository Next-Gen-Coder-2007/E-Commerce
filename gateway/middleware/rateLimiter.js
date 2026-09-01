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

export const createGatewayRateLimiter = ({
  windowMs = 60 * 1000,
  max = 100,
  message = 'Too many requests through API Gateway. Please slow down.',
  keyPrefix = 'gw:rl',
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
        const count = await redisClient.incr(key);

        if (count === 1) {
          await redisClient.expire(key, windowSeconds);
        }

        const ttl = await redisClient.ttl(key);

        res.setHeader('X-Gateway-RateLimit-Limit', max);
        res.setHeader('X-Gateway-RateLimit-Remaining', Math.max(0, max - count));

        if (count > max) {
          res.setHeader('Retry-After', ttl > 0 ? ttl : windowSeconds);
          return res.status(429).json({
            success: false,
            message,
            retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
            gateway: 'api-gateway',
          });
        }

        return next();
      }
    } catch (redisErr) {
      console.warn(`[Gateway RateLimiter] Redis warning: ${redisErr.message}`);
    }

    const now = Date.now();
    let record = inMemoryStore.get(key);

    if (!record || record.expiresAt < now) {
      record = { count: 1, expiresAt: now + windowMs };
      inMemoryStore.set(key, record);
    } else {
      record.count += 1;
    }

    res.setHeader('X-Gateway-RateLimit-Limit', max);
    res.setHeader('X-Gateway-RateLimit-Remaining', Math.max(0, max - record.count));

    if (record.count > max) {
      const remainingSeconds = Math.ceil((record.expiresAt - now) / 1000);
      res.setHeader('Retry-After', remainingSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: remainingSeconds,
        gateway: 'api-gateway',
      });
    }

    next();
  };
};

export const globalRateLimiter = createGatewayRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: 'Gateway rate limit exceeded. Please try again in 1 minute.',
  keyPrefix: 'gw:global',
});

const isDev = process.env.NODE_ENV !== 'production';

export const authGatewayRateLimiter = createGatewayRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 30,
  message: 'Too many authentication attempts via Gateway. Please try again in 15 minutes.',
  keyPrefix: 'gw:auth',
});
