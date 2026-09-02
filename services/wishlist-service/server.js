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
import wishlistRoutes from './routes/wishlistRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { isRedisReady } from './config/redis.js';
import wishlistConsumer from './events/wishlistConsumer.js';
import {
  createMetricsRegistry,
  metricsMiddleware,
  traceMiddleware,
  createLogger,
} from '../shared/telemetry/index.js';

connectDB();
wishlistConsumer.start().catch((err) => console.warn('[Wishlist Consumer] Start error:', err.message));

const metrics = createMetricsRegistry('wishlist-service');
const logger = createLogger('wishlist-service');

const app = express();
const PORT = process.env.PORT || 5006;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(traceMiddleware('wishlist-service'));
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
    service: 'wishlist-service',
    status: 'ok',
    redis: isRedisReady() ? 'connected' : 'offline/fallback',
    features: ['saved-items', 'price-drop-tracking', 'public-shareable-registry', 'move-to-cart'],
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get('/api/wishlist/health', healthHandler);

// Standard Routes
app.use('/api/wishlist', wishlistRoutes);
app.use('/', wishlistRoutes);

app.use(notFound);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Wishlist Service] Running on port ${PORT}`);
  });
}

export default app;
