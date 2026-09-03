import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { correlationIdMiddleware } from './middleware/logging.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { attachAuthContext } from './middleware/authGateway.js';
import { gatewayNotFound, gatewayErrorHandler } from './middleware/errorMiddleware.js';
import {
  gatewayTracer,
  gatewayMetricsMiddleware,
  metricsEndpointHandler,
} from './middleware/telemetry.js';
import gatewayRoutes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy for cloud deployments behind reverse proxies (Render, Railway, Fly, Heroku, AWS ALB)
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Dynamic allowed origins parser for multi-domain hosting
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
  if (!origin) return true; // allow curl, mobile, health checks, server-to-server
  const cleanOrigin = origin.replace(/\/$/, '');

  // Exact match
  if (allowedOrigins.includes(cleanOrigin)) return true;

  // Wildcard / allow all mode
  if (process.env.CORS_ORIGIN === '*' || process.env.ALLOW_ALL_ORIGINS === 'true') {
    return true;
  }

  // Automatic match for standard cloud preview domains (Vercel, Netlify, Render, Railway)
  if (process.env.ALLOW_PREVIEW_ORIGINS === 'true' || process.env.NODE_ENV !== 'production') {
    if (
      cleanOrigin.endsWith('.vercel.app') ||
      cleanOrigin.endsWith('.netlify.app') ||
      cleanOrigin.endsWith('.onrender.com') ||
      cleanOrigin.endsWith('.up.railway.app')
    ) {
      return true;
    }
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-idempotency-key',
    'traceparent',
    'x-correlation-id',
    'x-user-id',
    'x-user-role',
  ],
  exposedHeaders: ['traceparent', 'x-correlation-id'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(cookieParser());
app.use(gatewayTracer);
app.use(gatewayMetricsMiddleware);
app.use(correlationIdMiddleware);
app.use(globalRateLimiter);
app.use(attachAuthContext);

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Root welcome & cluster health endpoint (for cloud platform deployment checks)
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'api-gateway',
    status: 'operational',
    name: 'NovaCommerce Enterprise API Gateway',
    version: '1.0.0',
    documentation: '/docs',
    openApiSpec: '/openapi.json',
    health: '/health',
    metrics: '/metrics',
    apiRoot: '/api',
    timestamp: new Date().toISOString(),
  });
});

// Prometheus Metrics Exporter
app.get('/metrics', metricsEndpointHandler);
app.get('/api/metrics', metricsEndpointHandler);

// OpenAPI Spec & Interactive Swagger UI
app.get('/openapi.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'openapi.json'));
});
app.get(['/docs', '/api-docs'], (req, res) => {
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
        url: '/openapi.json',
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

app.use('/api', gatewayRoutes);

app.use(gatewayNotFound);
app.use(gatewayErrorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[API Gateway] Running on port ${PORT}`);
    console.log(`[API Gateway] Routing endpoints configured at /api/*`);
  });
}

export default app;
