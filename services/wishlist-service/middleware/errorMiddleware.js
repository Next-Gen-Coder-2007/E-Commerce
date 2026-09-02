export const notFound = (req, res, next) => {
  const error = new Error(`Wishlist Service route ${req.originalUrl} not found`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const correlationId = req.correlationId || req.headers['x-correlation-id'];

  console.error(`[Wishlist Service Error] [${correlationId || 'no-id'}]: ${err.message}`);

  res.status(statusCode).json({
    success: false,
    statusCode,
    message: err.message || 'Internal Wishlist Service Error',
    error: {
      code: err.name || 'WISHLIST_ERROR',
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...(correlationId && { correlationId }),
      version: 'v1',
    },
  });
};

export default {
  notFound,
  errorHandler,
};
