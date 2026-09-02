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

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

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
app.use(gatewayTracer);
app.use(gatewayMetricsMiddleware);
app.use(correlationIdMiddleware);
app.use(globalRateLimiter);
app.use(attachAuthContext);

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

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
