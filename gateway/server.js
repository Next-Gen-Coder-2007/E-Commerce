import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Security & utility middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration supporting frontend credentials and cookies
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Microservice endpoint registry
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
  // Future services:
  // product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002',
  // cart: process.env.CART_SERVICE_URL || 'http://localhost:5003',
  // order: process.env.ORDER_SERVICE_URL || 'http://localhost:5004',
  // payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5005',
  // notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5006',
};

// Gateway health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    service: 'api-gateway',
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      auth: services.auth,
    },
  });
});

// Helper to construct microservice proxy
const createServiceProxy = (targetUrl, serviceName) => {
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    cookieDomainRewrite: '',
    cookiePathRewrite: '/',
    on: {
      proxyReq: (proxyReq, req) => {
        // Forward client IP and original headers
        const clientIp =
          req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (clientIp) {
          proxyReq.setHeader('x-forwarded-for', clientIp);
        }
      },
      error: (err, req, res) => {
        console.error(`[Gateway Proxy Error -> ${serviceName}]:`, err.message);
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            message: `${serviceName} is currently unavailable. Please try again later.`,
          });
        }
      },
    },
  });
};

// 1. Auth Service Proxy (/api/auth/*)
app.use('/api/auth', createServiceProxy(services.auth, 'Auth Service'));

// 404 Handler for unregistered routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Gateway route ${req.originalUrl} not found`,
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[API Gateway] Running on port ${PORT}`);
    console.log(`[API Gateway] Routing /api/auth -> ${services.auth}`);
  });
}

export default app;
