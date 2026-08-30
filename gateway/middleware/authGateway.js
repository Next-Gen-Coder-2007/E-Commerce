import jwt from 'jsonwebtoken';

const extractToken = (req) => {
  if (req.cookies && req.cookies.jwt) {
    return req.cookies.jwt;
  }
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

export const attachAuthContext = (req, res, next) => {
  const token = extractToken(req);
  const jwtSecret = process.env.JWT_SECRET;

  if (!token || !jwtSecret) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;

    if (decoded.userId) {
      req.headers['x-user-id'] = decoded.userId;
    }
    if (decoded.role) {
      req.headers['x-user-role'] = decoded.role;
    }
    if (decoded.email) {
      req.headers['x-user-email'] = decoded.email;
    }
    if (decoded.companyName) {
      req.headers['x-user-company'] = encodeURIComponent(decoded.companyName);
    }
  } catch (err) {
    req.user = null;
  }

  next();
};

export const requireAuth = (allowedRoles = []) => {
  return (req, res, next) => {
    const token = extractToken(req);
    const jwtSecret = process.env.JWT_SECRET;

    if (!token || !jwtSecret) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No valid authorization token found.',
        gateway: 'api-gateway',
      });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;

      if (decoded.userId) {
        req.headers['x-user-id'] = decoded.userId;
      }
      if (decoded.role) {
        req.headers['x-user-role'] = decoded.role;
      }
      if (decoded.email) {
        req.headers['x-user-email'] = decoded.email;
      }
      if (decoded.companyName) {
        req.headers['x-user-company'] = encodeURIComponent(decoded.companyName);
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Role '${decoded.role}' is not authorized for this resource.`,
          gateway: 'api-gateway',
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Session token has expired or is invalid. Please sign in again.',
        gateway: 'api-gateway',
      });
    }
  };
};
