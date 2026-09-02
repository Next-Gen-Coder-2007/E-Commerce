import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import connectDB from './config/db.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { isRedisReady } from './config/redis.js';
import paymentConsumer from './events/paymentConsumer.js';
import { createOutboxPublisher } from '../shared/outbox/index.js';
import {
  createMetricsRegistry,
  metricsMiddleware,
  traceMiddleware,
  createLogger,
} from '../shared/telemetry/index.js';

connectDB();
paymentConsumer.start().catch((err) => console.warn('[Payment Consumer] Start error:', err.message));

const outboxPublisher = createOutboxPublisher('payment-service');
outboxPublisher.start();

const metrics = createMetricsRegistry('payment-service');
const logger = createLogger('payment-service');

const app = express();
const PORT = process.env.PORT || 5005;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(traceMiddleware('payment-service'));
app.use(metricsMiddleware(metrics));

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Prometheus Metrics Exporter
app.get('/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.status(200).send(metrics.toPrometheusFormat());
});

const healthHandler = (req, res) => {
  res.status(200).json({
    service: 'payment-service',
    status: 'ok',
    redis: isRedisReady() ? 'connected' : 'offline/fallback',
    features: ['idempotency-keys', 'stripe-mock-gateway', 'refunds', 'webhooks'],
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get('/api/payments/health', healthHandler);

import fraudRoutes from './modules/fraud-engine/fraudRoutes.js';

// Standard Routes
app.use('/api/payments/fraud', fraudRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/', paymentRoutes);

app.use(notFound);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Payment Service] Running on port ${PORT}`);
  });
}

export default app;
