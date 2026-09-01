import express from 'express';
import serviceRegistry from '../config/services.js';
import { isRedisReady } from '../config/redis.js';
import { createMicroserviceProxy } from './proxyHandler.js';
import { authGatewayRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/health', (req, res) => {
  const serviceStatuses = Object.entries(serviceRegistry).reduce(
    (acc, [key, svc]) => {
      acc[key] = {
        name: svc.name,
        route: svc.routePrefix,
        instances: svc.instances,
      };
      return acc;
    },
    {}
  );

  res.status(200).json({
    service: 'api-gateway',
    status: 'ok',
    timestamp: new Date().toISOString(),
    redisRateLimiter: isRedisReady() ? 'connected' : 'offline/fallback',
    registeredServices: serviceStatuses,
  });
});

router.get('/gateway/services', (req, res) => {
  res.status(200).json({
    success: true,
    services: serviceRegistry,
  });
});

router.use(
  '/auth',
  authGatewayRateLimiter,
  createMicroserviceProxy({
    serviceKey: 'auth',
    serviceName: serviceRegistry.auth.name,
    instances: serviceRegistry.auth.instances,
  })
);

router.use(
  '/products',
  createMicroserviceProxy({
    serviceKey: 'products',
    serviceName: serviceRegistry.products.name,
    instances: serviceRegistry.products.instances,
  })
);

router.use(
  '/cart',
  createMicroserviceProxy({
    serviceKey: 'cart',
    serviceName: serviceRegistry.cart.name,
    instances: serviceRegistry.cart.instances,
  })
);

router.use(
  '/orders',
  createMicroserviceProxy({
    serviceKey: 'orders',
    serviceName: serviceRegistry.orders.name,
    instances: serviceRegistry.orders.instances,
  })
);

export default router;
