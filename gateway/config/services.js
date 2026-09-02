const parseInstances = (envUrls, fallbackUrl) => {
  const raw = envUrls || fallbackUrl;
  return raw
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
};

export const serviceRegistry = {
  auth: {
    name: 'Auth Service',
    routePrefix: '/api/auth',
    instances: parseInstances(
      process.env.AUTH_SERVICE_URLS,
      process.env.AUTH_SERVICE_URL || 'http://localhost:5001'
    ),
    stripPrefix: false,
    requireAuth: false,
  },
  products: {
    name: 'Product & Catalog Service',
    routePrefix: '/api/products',
    instances: parseInstances(
      process.env.PRODUCT_SERVICE_URLS,
      process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002'
    ),
    stripPrefix: false,
    requireAuth: false,
  },
  cart: {
    name: 'Cart Service',
    routePrefix: '/api/cart',
    instances: parseInstances(
      process.env.CART_SERVICE_URLS,
      process.env.CART_SERVICE_URL || 'http://localhost:5003'
    ),
    stripPrefix: false,
    requireAuth: false,
  },
  orders: {
    name: 'Order Service',
    routePrefix: '/api/orders',
    instances: parseInstances(
      process.env.ORDER_SERVICE_URLS,
      process.env.ORDER_SERVICE_URL || 'http://localhost:5004'
    ),
    stripPrefix: false,
    requireAuth: false,
  },
  payments: {
    name: 'Payment Service',
    routePrefix: '/api/payments',
    instances: parseInstances(
      process.env.PAYMENT_SERVICE_URLS,
      process.env.PAYMENT_SERVICE_URL || 'http://localhost:5005'
    ),
    stripPrefix: false,
    requireAuth: false,
  },
  wishlist: {
    name: 'Wishlist Service',
    routePrefix: '/api/wishlist',
    instances: parseInstances(
      process.env.WISHLIST_SERVICE_URLS,
      process.env.WISHLIST_SERVICE_URL || 'http://localhost:5006'
    ),
    stripPrefix: false,
    requireAuth: false,
  },
  inventory: {
    name: 'Inventory Service',
    routePrefix: '/api/inventory',
    instances: parseInstances(
      process.env.INVENTORY_SERVICE_URLS,
      process.env.INVENTORY_SERVICE_URL || 'http://localhost:5007'
    ),
    stripPrefix: false,
    requireAuth: false,
  },
  reviews: {
    name: 'Review Service (Product Service)',
    routePrefix: '/api/reviews',
    instances: parseInstances(
      process.env.PRODUCT_SERVICE_URLS,
      process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002'
    ),
    stripPrefix: false,
    requireAuth: false,
  },
  coupons: {
    name: 'Coupon Service (Product Service)',
    routePrefix: '/api/coupons',
    instances: parseInstances(
      process.env.PRODUCT_SERVICE_URLS,
      process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002'
    ),
    stripPrefix: false,
    requireAuth: false,
  },
};

export default serviceRegistry;
