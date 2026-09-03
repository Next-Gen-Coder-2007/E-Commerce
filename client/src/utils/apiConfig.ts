/**
 * Dynamic resolution of the API Gateway base URL.
 * Automatically adapts between local development (http://localhost:5000)
 * and production deployments (e.g. https://api.yourdomain.com).
 */
export const getGatewayBaseUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && typeof apiUrl === 'string') {
    // Strip trailing /api or /api/
    return apiUrl.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined' && window.location.origin) {
    // If client is running on localhost:5173, gateway is localhost:5000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    // In production relative setups, fallback to window.location.origin
    return window.location.origin;
  }
  return 'http://localhost:5000';
};
