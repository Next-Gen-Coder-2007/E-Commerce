import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient = null;
let isRedisConnected = false;

try {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        return null; // Stop retrying after 3 attempts if offline in dev
      }
      return Math.min(times * 500, 2000);
    },
    lazyConnect: true,
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    console.log('[Auth Service] Redis connected successfully');
  });

  redisClient.on('ready', () => {
    isRedisConnected = true;
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    // Log once as warning in development without throwing fatal error
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[Auth Service] Redis status: ${err.message}`);
    }
  });

  redisClient.on('close', () => {
    isRedisConnected = false;
  });

  // Attempt non-blocking connection
  redisClient.connect().catch(() => {
    isRedisConnected = false;
  });
} catch (error) {
  console.warn(`[Auth Service] Could not initialize Redis client: ${error.message}`);
}

/**
 * Checks if Redis is currently connected and responsive.
 * @returns {boolean}
 */
export const isRedisReady = () => isRedisConnected && redisClient && redisClient.status === 'ready';

/**
 * Returns the active Redis instance.
 */
export const getRedisClient = () => redisClient;

export default redisClient;
