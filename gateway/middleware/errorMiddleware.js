export const gatewayNotFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Gateway route '${req.originalUrl}' not found or service unregistered.`,
    gateway: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
};

export const gatewayErrorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error(`[API Gateway Error] [${req.correlationId || 'no-id'}] ${err.message}`);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Gateway Error',
    gateway: 'api-gateway',
    correlationId: req.correlationId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
