/**
 * Standardized API Response and Error Envelopes for Order Service
 */

export const sendSuccess = (
  res,
  {
    statusCode = 200,
    message = 'Operation successful',
    data = null,
    meta = {},
    ...customFields
  } = {}
) => {
  const correlationId = res.req?.correlationId || res.req?.headers['x-correlation-id'] || undefined;

  const responseBody = {
    success: true,
    message,
    ...(data && typeof data === 'object' && !Array.isArray(data) ? data : {}),
    ...(Array.isArray(data) ? { data } : {}),
    ...customFields,
    meta: {
      timestamp: new Date().toISOString(),
      ...(correlationId && { correlationId }),
      version: 'v1',
      ...meta,
    },
  };

  return res.status(statusCode).json(responseBody);
};

export const sendError = (
  res,
  {
    statusCode = 500,
    message = 'An unexpected error occurred',
    code = 'INTERNAL_SERVER_ERROR',
    details = null,
    ...customFields
  } = {}
) => {
  const correlationId = res.req?.correlationId || res.req?.headers['x-correlation-id'] || undefined;

  const responseBody = {
    success: false,
    statusCode,
    message,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    ...customFields,
    meta: {
      timestamp: new Date().toISOString(),
      ...(correlationId && { correlationId }),
      version: 'v1',
    },
  };

  return res.status(statusCode).json(responseBody);
};

export default {
  sendSuccess,
  sendError,
};
