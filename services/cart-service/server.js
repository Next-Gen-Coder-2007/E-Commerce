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
import cartRoutes from './routes/cartRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { isRedisReady } from './config/redis.js';
import {
  createMetricsRegistry,
  metricsMiddleware,
  traceMiddleware,
  createLogger,
} from '../shared/telemetry/index.js';

connectDB();

const metrics = createMetricsRegistry('cart-service');
const logger = createLogger('cart-service');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(traceMiddleware('cart-service'));
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
    service: 'cart-service',
    status: 'ok',
    redis: isRedisReady() ? 'connected' : 'offline/fallback',
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get('/api/cart/health', healthHandler);

// Standard Routes
app.use('/api/cart', cartRoutes);
app.use('/', cartRoutes);

app.use(notFound);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Cart Service] Running on port ${PORT}`);
  });
}

export default app;
