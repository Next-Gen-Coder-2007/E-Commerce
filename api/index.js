/**
 * NovaCommerce Vercel Serverless Function Handler
 *
 * Mounts all 8 microservices and gateway features directly in an in-process
 * Express application compatible with Vercel Serverless Functions.
 */

import 'dotenv/config';
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
    'x-guest-cart-id',
    'X-Guest-Cart-Id',
    'x-cart-id',
    'X-Cart-Id',
    'x-session-id',
    'x-visitor-id',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['traceparent', 'x-correlation-id', 'x-guest-cart-id'],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(correlationIdMiddleware);
app.use(attachAuthContext);

// ==========================================
// Cached MongoDB Connection for Serverless & Local Fallback
// ==========================================
// Attempt to load services-scoped Mongoose if separate instance exists in services/node_modules
let servicesMongoose = null;
try {
  const sm = await import('../services/node_modules/mongoose/index.js');
  servicesMongoose = sm.default || sm;
} catch {
  // Hoisted or shared node_modules environment
}

let cachedPromise = null;
let lastConnectAttempt = 0;
const RETRY_THROTTLE_MS = 15000;

const getDatabaseURI = () => {
  // 1. Online / Environment Variable priority (Vercel Serverless / Atlas)
  if (process.env.MONGO_URI && process.env.MONGO_URI.trim()) {
    return process.env.MONGO_URI.trim();
  }
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) {
    return process.env.MONGODB_URI.trim();
  }

  // 2. Local development fallback (localhost / 127.0.0.1)
  const isServerless = Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (!isServerless) {
    const localHost = process.env.MONGO_HOST || '127.0.0.1';
    const localPort = process.env.MONGO_PORT || '27017';
    const localDb = process.env.MONGO_DB_NAME || 'novacommerce';
    return `mongodb://${localHost}:${localPort}/${localDb}`;
  }

  return null;
};

const connectInstance = async (mInstance, uri, opts) => {
  if (mInstance && mInstance.connection && mInstance.connection.readyState < 1) {
    return await mInstance.connect(uri, opts);
  }
  return mInstance ? mInstance.connection : null;
};

const connectToDatabase = async () => {
  const rootReady = mongoose.connection.readyState >= 1;
  const servicesReady = !servicesMongoose || servicesMongoose.connection.readyState >= 1;
  if (rootReady && servicesReady) {
    return mongoose.connection;
  }

  const now = Date.now();
  if (cachedPromise) {
    return cachedPromise;
  }
  if (now - lastConnectAttempt < RETRY_THROTTLE_MS) {
    return null;
  }
  lastConnectAttempt = now;

  let mongoURI = getDatabaseURI();
  if (!mongoURI) {
    console.warn('[NovaCommerce Database] Warning: No database connection URI configured. Please set MONGO_URI in .env');
    return null;
  }

  let isLocal = mongoURI.includes('localhost') || mongoURI.includes('127.0.0.1');
  let targetLabel = isLocal ? 'Localhost MongoDB (Development)' : 'Online MongoDB Cluster (Serverless / Atlas)';

  const connOpts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: isLocal ? 5 : 10,
  };

  const doConnect = async (uri, label) => {
    const conn = await connectInstance(mongoose, uri, connOpts);
    if (servicesMongoose && servicesMongoose !== mongoose) {
      await connectInstance(servicesMongoose, uri, connOpts);
    }
    console.log(`[NovaCommerce Database] Connected to ${label} on host: ${conn?.host || 'remote'}`);
    return conn;
  };

  try {
    cachedPromise = (async () => {
      try {
        return await doConnect(mongoURI, targetLabel);
      } catch (err) {
        console.error(`[NovaCommerce Database] Connection Error (${targetLabel}): ${err.message}`);
        throw err;
      }
    })();

    const result = await cachedPromise;
    return result;
  } catch (err) {
    cachedPromise = null;
    throw err;
  }
};

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
  } catch (err) {
    // Non-blocking per-request handler, throttled logging
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

const PORT = process.env.PORT || 5000;
if (process.argv[1] && (process.argv[1].endsWith('api/index.js') || process.argv[1].endsWith('api\\index.js'))) {
  app.listen(PORT, async () => {
    console.log(`[API Server] Running on http://localhost:${PORT}`);
    try {
      await connectToDatabase();
    } catch {
      // Non-blocking initial connection attempt
    }
  });
}

export default app;
