/**
 * NovaCommerce Vercel Serverless Function Handler
 *
 * Mounts all 8 microservices and gateway features directly in an in-process
 * Express application compatible with Vercel Serverless Functions.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Microservice Route Modules
import authRoutes from '../services/auth-service/routes/authRoutes.js';
import { catalogRoutes, reviewRoutes, couponRoutes } from '../services/product-service/modules/index.js';
import cartRoutes from '../services/cart-service/routes/cartRoutes.js';
import orderRoutes from '../services/order-service/routes/orderRoutes.js';
import paymentRoutes from '../services/payment-service/routes/paymentRoutes.js';
import wishlistRoutes from '../services/wishlist-service/routes/wishlistRoutes.js';
import inventoryRoutes from '../services/inventory-service/routes/inventoryRoutes.js';

// Gateway Middleware
import { attachAuthContext } from '../gateway/middleware/authGateway.js';
import { correlationIdMiddleware } from '../gateway/middleware/logging.js';

const app = express();

// Trust proxy for Vercel edge reverse proxy
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Dynamic CORS configuration
const parseAllowedOrigins = () => {
  const envOrigins = [
    process.env.CLIENT_URL,
    process.env.ALLOWED_ORIGINS,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]
    .filter(Boolean)
    .flatMap((entry) => entry.split(','))
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  return Array.from(new Set(envOrigins));
};

const allowedOrigins = parseAllowedOrigins();

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.replace(/\/$/, '');
  if (allowedOrigins.includes(cleanOrigin)) return true;
  if (process.env.CORS_ORIGIN === '*' || process.env.ALLOW_ALL_ORIGINS === 'true') return true;
  if (
    cleanOrigin.endsWith('.vercel.app') ||
    cleanOrigin.endsWith('.netlify.app') ||
    cleanOrigin.endsWith('.onrender.com') ||
    cleanOrigin.endsWith('.up.railway.app')
  ) {
    return true;
  }
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback to permissive on Vercel preview URLs
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-idempotency-key',
    'Idempotency-Key',
    'traceparent',
    'x-correlation-id',
    'x-user-id',
    'x-user-role',
  ],
  exposedHeaders: ['traceparent', 'x-correlation-id'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(correlationIdMiddleware);
app.use(attachAuthContext);

// ==========================================
// Cached MongoDB Connection for Serverless
// ==========================================
let isDbConnected = false;

const connectToDatabase = async () => {
  if (isDbConnected && mongoose.connection.readyState >= 1) {
    return;
  }

  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.warn('[Vercel Serverless] Warning: MONGO_URI is not set in environment variables');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
    isDbConnected = true;
    console.log(`[Vercel Serverless] MongoDB connected to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Vercel Serverless] MongoDB Connection Error: ${error.message}`);
  }
};

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
  } catch (err) {
    console.warn('[Vercel Serverless] DB connection attempt:', err.message);
  }
  next();
});

// ==========================================
// Root API & Health Endpoints
// ==========================================
const apiStatusHandler = (req, res) => {
  res.status(200).json({
    service: 'novacommerce-api',
    platform: 'vercel-serverless',
    status: 'operational',
    version: '1.0.0',
    documentation: '/api/docs',
    openApiSpec: '/api/openapi.json',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting/offline',
    timestamp: new Date().toISOString(),
  });
};

app.get(['/api', '/api/health', '/health'], apiStatusHandler);

// ==========================================
// Swagger UI & OpenAPI Specification
// ==========================================
app.get(['/api/openapi.json', '/openapi.json'], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'gateway', 'docs', 'openapi.json'));
});

app.get(['/api/docs', '/docs'], (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NovaCommerce Enterprise API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>body { margin: 0; background: #fafafa; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: 'BaseLayout'
      });
    };
  </script>
</body>
</html>`);
});

// ==========================================
// Mount Microservice Routes
// ==========================================
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/products', '/products'], catalogRoutes);
app.use(['/api/reviews', '/reviews'], reviewRoutes);
app.use(['/api/coupons', '/coupons'], couponRoutes);
app.use(['/api/cart', '/cart'], cartRoutes);
app.use(['/api/orders', '/orders'], orderRoutes);
app.use(['/api/payments', '/payments'], paymentRoutes);
app.use(['/api/wishlist', '/wishlist'], wishlistRoutes);
app.use(['/api/inventory', '/inventory'], inventoryRoutes);

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint '${req.method} ${req.originalUrl}' was not found on NovaCommerce API.`,
    availableDocs: '/api/docs',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Vercel API Error]', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

export default app;
