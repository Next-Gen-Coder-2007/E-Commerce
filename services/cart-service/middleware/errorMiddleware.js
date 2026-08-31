export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cart Service route ${req.originalUrl} not found`,
  });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error(`[Cart Service Error]: ${err.message}`);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Cart Service Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
