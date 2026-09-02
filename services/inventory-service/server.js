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
import inventoryRoutes from './routes/inventoryRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { isRedisReady } from './config/redis.js';
import inventoryConsumer from './events/inventoryConsumer.js';
import { createOutboxPublisher } from '../shared/outbox/index.js';
import {
  createMetricsRegistry,
  metricsMiddleware,
  traceMiddleware,
  createLogger,
} from '../shared/telemetry/index.js';

connectDB();
inventoryConsumer.start().catch((err) => console.warn('[Inventory Consumer] Start error:', err.message));

const outboxPublisher = createOutboxPublisher('inventory-service');
outboxPublisher.start();

const metrics = createMetricsRegistry('inventory-service');
const logger = createLogger('inventory-service');

const app = express();
const PORT = process.env.PORT || 5007;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(traceMiddleware('inventory-service'));
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
    service: 'inventory-service',
    status: 'ok',
    redis: isRedisReady() ? 'connected' : 'offline/fallback',
    features: ['two-phase-reservation', 'stock-audit', 'merchant-restock'],
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get('/api/inventory/health', healthHandler);

// Standard Routes
app.use('/api/inventory', inventoryRoutes);
app.use('/', inventoryRoutes);

app.use(notFound);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Inventory Service] Running on port ${PORT}`);
  });
}

export default app;
