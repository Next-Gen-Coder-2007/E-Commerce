import { createProxyMiddleware } from 'http-proxy-middleware';
import { getNextInstance } from '../middleware/loadBalancer.js';

export const createMicroserviceProxy = ({
  serviceKey,
  serviceName,
  instances,
  pathRewrite,
}) => {
  return createProxyMiddleware({
    router: () => getNextInstance(serviceKey, instances),
    changeOrigin: true,
    cookieDomainRewrite: '',
    cookiePathRewrite: '/',
    pathRewrite,
    on: {
      proxyReq: (proxyReq, req) => {
        const clientIp =
          req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (clientIp) {
          proxyReq.setHeader('x-forwarded-for', clientIp);
        }

        if (req.correlationId) {
          proxyReq.setHeader('x-correlation-id', req.correlationId);
        }

        if (req.user) {
          if (req.user.userId) {
            proxyReq.setHeader('x-user-id', req.user.userId);
          }
          if (req.user.role) {
            proxyReq.setHeader('x-user-role', req.user.role);
          }
          if (req.user.email) {
            proxyReq.setHeader('x-user-email', req.user.email);
          }
          if (req.user.companyName) {
            proxyReq.setHeader(
              'x-user-company',
              encodeURIComponent(req.user.companyName)
            );
          }
        }
      },
      error: (err, req, res) => {
        console.error(
          `[API Gateway Proxy Error -> ${serviceName}] [${req.correlationId || 'no-id'}]: ${err.message}`
        );
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            message: `${serviceName} is currently unavailable. Please verify service connectivity.`,
            gateway: 'api-gateway',
            service: serviceKey,
            correlationId: req.correlationId,
          });
        }
      },
    },
  });
};
