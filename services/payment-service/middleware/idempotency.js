import crypto from 'crypto';
import redisClient, { isRedisReady } from '../config/redis.js';

export const idempotencyMiddleware = async (req, res, next) => {
  const headerKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || req.body?.idempotencyKey;

  // If no explicit idempotency key provided, build a deterministic fallback hash
  let idempotencyKey = headerKey;
  if (!idempotencyKey && req.body?.orderId && req.body?.amount) {
    const rawSignature = `${req.user?.userId || 'anon'}:${req.body.orderId}:${req.body.amount}`;
    idempotencyKey = `auto_${crypto.createHash('sha256').update(rawSignature).digest('hex').slice(0, 24)}`;
  }

  if (!idempotencyKey) {
    return next();
  }

  req.idempotencyKey = idempotencyKey;

  if (!isRedisReady()) {
    return next();
  }

  try {
    const redisKey = `idempotency:pay:${idempotencyKey}`;
    const acquired = await redisClient.set(redisKey, 'PROCESSING', 'NX', 'EX', 120);

    if (!acquired) {
      // Key already exists - read status
      const existing = await redisClient.get(redisKey);
      if (existing === 'PROCESSING') {
        return res.status(409).json({
          success: false,
          statusCode: 409,
          code: 'PAYMENT_IN_PROGRESS',
          message: 'A payment request with this Idempotency-Key is currently being processed. Please wait.',
          idempotencyKey,
        });
      }

      if (existing) {
        try {
          const cachedResult = JSON.parse(existing);
          res.setHeader('X-Idempotent-Replay', 'true');
          return res.status(cachedResult.statusCode || 200).json({
            ...cachedResult.body,
            _idempotentReplay: true,
          });
        } catch (parseErr) {
          // Fall through
        }
      }
    }
  } catch (err) {
    console.warn('[Payment Idempotency] Redis check warning:', err.message);
  }

  next();
};

export const cacheIdempotentResult = async (key, statusCode, body, ttlSeconds = 86400) => {
  if (!key || !isRedisReady()) return;
  try {
    const redisKey = `idempotency:pay:${key}`;
    await redisClient.set(
      redisKey,
      JSON.stringify({ statusCode, body }),
      'EX',
      ttlSeconds
    );
  } catch (err) {
    console.warn('[Payment Idempotency] Cache store warning:', err.message);
  }
};

export default {
  idempotencyMiddleware,
  cacheIdempotentResult,
};
