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
import orderRoutes from './routes/orderRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { isRedisReady } from './config/redis.js';

connectDB();

const app = express();
const PORT = process.env.PORT || 5004;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'order-service',
    status: 'ok',
    redis: isRedisReady() ? 'connected' : 'offline/fallback',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/orders/health', (req, res) => {
  res.status(200).json({
    service: 'order-service',
    status: 'ok',
    redis: isRedisReady() ? 'connected' : 'offline/fallback',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/orders', orderRoutes);
app.use('/', orderRoutes);

app.use(notFound);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Order Service] Running on port ${PORT}`);
  });
}

export default app;
