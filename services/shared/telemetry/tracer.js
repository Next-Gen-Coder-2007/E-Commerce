import crypto from 'crypto';

/**
 * W3C TraceContext & Distributed Tracing Utilities
 * Format: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
 * version(2) - traceId(32) - parentId/spanId(16) - traceFlags(2)
 */

export const generateTraceId = () => crypto.randomBytes(16).toString('hex');
export const generateSpanId = () => crypto.randomBytes(8).toString('hex');

export const generateTraceparent = (traceId = generateTraceId(), spanId = generateSpanId()) => {
  return `00-${traceId}-${spanId}-01`;
};

export const parseTraceparent = (header) => {
  if (!header || typeof header !== 'string') return null;
  const match = header.match(/^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i);
  if (!match) return null;
  return {
    version: '00',
    traceId: match[1],
    parentId: match[2],
    flags: match[3],
  };
};

/**
 * Express Middleware for Trace Propagation & Correlation Injection
 */
export const traceMiddleware = (serviceName = 'unknown-service') => {
  return (req, res, next) => {
    // 1. Extract or create W3C traceparent
    const incomingTraceparent = req.headers['traceparent'];
    const parsed = parseTraceparent(incomingTraceparent);

    const traceId = parsed?.traceId || req.headers['x-trace-id'] || generateTraceId();
    const parentSpanId = parsed?.parentId;
    const currentSpanId = generateSpanId();

    const traceparent = `00-${traceId}-${currentSpanId}-01`;

    // 2. Extract or create Correlation ID
    const correlationId =
      req.headers['x-correlation-id'] ||
      req.headers['x-request-id'] ||
      `corr_${crypto.randomBytes(8).toString('hex')}`;

    // Attach to request context
    req.traceContext = {
      traceId,
      parentSpanId,
      spanId: currentSpanId,
      traceparent,
      correlationId,
      service: serviceName,
      startTime: Date.now(),
    };

    // Expose in response headers
    res.setHeader('traceparent', traceparent);
    res.setHeader('x-trace-id', traceId);
    res.setHeader('x-correlation-id', correlationId);

    next();
  };
};

export default {
  generateTraceId,
  generateSpanId,
  generateTraceparent,
  parseTraceparent,
  traceMiddleware,
};
