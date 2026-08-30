import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient = null;
let isRedisConnected = false;

try {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 500, 2000);
    },
    lazyConnect: true,
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    console.log('[API Gateway] Redis connected for rate limiting');
  });

  redisClient.on('ready', () => {
    isRedisConnected = true;
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[API Gateway] Redis status: ${err.message}`);
    }
  });

  redisClient.on('close', () => {
    isRedisConnected = false;
  });

  redisClient.connect().catch(() => {
    isRedisConnected = false;
  });
} catch (error) {
  console.warn(`[API Gateway] Redis initialization notice: ${error.message}`);
}

export const isRedisReady = () =>
  isRedisConnected && redisClient && redisClient.status === 'ready';

export const getRedisClient = () => redisClient;

export default redisClient;
