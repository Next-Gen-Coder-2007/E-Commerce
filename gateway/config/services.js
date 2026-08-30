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
};

export default serviceRegistry;
