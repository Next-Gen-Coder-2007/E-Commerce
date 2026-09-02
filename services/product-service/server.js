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
import { catalogRoutes, reviewRoutes, couponRoutes } from './modules/index.js';
import { sendError } from './utils/responseEnvelope.js';
import {
  createMetricsRegistry,
  metricsMiddleware,
  traceMiddleware,
  createLogger,
} from '../shared/telemetry/index.js';

connectDB();

const metrics = createMetricsRegistry('product-service');
const logger = createLogger('product-service');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(traceMiddleware('product-service'));
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
    service: 'product-service',
    status: 'ok',
    modules: ['catalog', 'reviews', 'coupons'],
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get('/api/products/health', healthHandler);

// Standard Microservice Routes
app.use('/api/reviews', reviewRoutes);
app.use('/reviews', reviewRoutes);

app.use('/api/coupons', couponRoutes);
app.use('/coupons', couponRoutes);

app.use('/api/products', catalogRoutes);
app.use('/products', catalogRoutes);
app.use('/', catalogRoutes);

app.use((req, res) => {
  sendError(res, {
    statusCode: 404,
    code: 'ROUTE_NOT_FOUND',
    message: `Product Service route ${req.originalUrl} not found`,
  });
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error(`[Product Service Error]: ${err.message}`);
  sendError(res, {
    statusCode,
    code: err.name || 'INTERNAL_ERROR',
    message: err.message || 'Internal Product Service Error',
    ...(process.env.NODE_ENV === 'development' && { details: err.stack }),
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Product Service] Modular Catalog, Reviews & Coupons Running on port ${PORT}`);
  });
}

export default app;
