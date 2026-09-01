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
import productRoutes from './routes/productRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import couponRoutes from './routes/couponRoutes.js';

connectDB();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'product-service',
    status: 'ok',
    features: ['catalog', 'reviews', 'coupons'],
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/products/health', (req, res) => {
  res.status(200).json({
    service: 'product-service',
    status: 'ok',
    features: ['catalog', 'reviews', 'coupons'],
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/reviews', reviewRoutes);
app.use('/reviews', reviewRoutes);

app.use('/api/coupons', couponRoutes);
app.use('/coupons', couponRoutes);

app.use('/api/products', productRoutes);
app.use('/products', productRoutes);
app.use('/', productRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Product Service route ${req.originalUrl} not found`,
  });
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error(`[Product Service Error]: ${err.message}`);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Product Service Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Product Service] Unified Catalog, Reviews & Coupons Running on port ${PORT}`);
  });
}

export default app;
