import {
  createMetricsRegistry,
  metricsMiddleware,
} from '../../services/shared/telemetry/metrics.js';
import {
  traceMiddleware,
  generateTraceparent,
} from '../../services/shared/telemetry/tracer.js';
import { createLogger } from '../../services/shared/telemetry/logger.js';

export const gatewayMetrics = createMetricsRegistry('api-gateway');
export const gatewayLogger = createLogger('api-gateway');
export const gatewayTracer = traceMiddleware('api-gateway');
export const gatewayMetricsMiddleware = metricsMiddleware(gatewayMetrics);

export const metricsEndpointHandler = (req, res) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.status(200).send(gatewayMetrics.toPrometheusFormat());
};
