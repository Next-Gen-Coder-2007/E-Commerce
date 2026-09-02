import express from 'express';
import serviceRegistry from '../config/services.js';
import { isRedisReady } from '../config/redis.js';
import { createMicroserviceProxy } from './proxyHandler.js';
import { authGatewayRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const healthResponse = (req, res) => {
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
};

router.get('/health', healthResponse);

router.get('/gateway/services', (req, res) => {
  res.status(200).json({
    success: true,
    services: serviceRegistry,
  });
});

// ==========================================
// Microservice Proxy Routes
// ==========================================

// Auth Service
router.use(
  '/auth',
  authGatewayRateLimiter,
  createMicroserviceProxy({
    serviceKey: 'auth',
    serviceName: serviceRegistry.auth.name,
    instances: serviceRegistry.auth.instances,
  })
);

// Products & Catalog Service
router.use(
  '/products',
  createMicroserviceProxy({
    serviceKey: 'products',
    serviceName: serviceRegistry.products.name,
    instances: serviceRegistry.products.instances,
    pathRewrite: (path) => `/products${path}`,
  })
);

// Shopping Cart Service
router.use(
  '/cart',
  createMicroserviceProxy({
    serviceKey: 'cart',
    serviceName: serviceRegistry.cart.name,
    instances: serviceRegistry.cart.instances,
  })
);

// Wishlist Service
router.use(
  '/wishlist',
  createMicroserviceProxy({
    serviceKey: 'wishlist',
    serviceName: serviceRegistry.wishlist.name,
    instances: serviceRegistry.wishlist.instances,
    pathRewrite: (path) => `/wishlist${path}`,
  })
);

// Order Fulfillment Service
router.use(
  '/orders',
  createMicroserviceProxy({
    serviceKey: 'orders',
    serviceName: serviceRegistry.orders.name,
    instances: serviceRegistry.orders.instances,
  })
);

// Payment Service
router.use(
  '/payments',
  createMicroserviceProxy({
    serviceKey: 'payments',
    serviceName: serviceRegistry.payments.name,
    instances: serviceRegistry.payments.instances,
    pathRewrite: (path) => `/payments${path}`,
  })
);

// Inventory Service
router.use(
  '/inventory',
  createMicroserviceProxy({
    serviceKey: 'inventory',
    serviceName: serviceRegistry.inventory.name,
    instances: serviceRegistry.inventory.instances,
    pathRewrite: (path) => `/inventory${path}`,
  })
);

// Customer Reviews Service
router.use(
  '/reviews',
  createMicroserviceProxy({
    serviceKey: 'reviews',
    serviceName: serviceRegistry.reviews.name,
    instances: serviceRegistry.reviews.instances,
    pathRewrite: (path) => `/reviews${path}`,
  })
);

// Promotional Coupons Service
router.use(
  '/coupons',
  createMicroserviceProxy({
    serviceKey: 'coupons',
    serviceName: serviceRegistry.coupons.name,
    instances: serviceRegistry.coupons.instances,
    pathRewrite: (path) => `/coupons${path}`,
  })
);

export default router;
