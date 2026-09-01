import jwt from 'jsonwebtoken';

export const attachOrderIdentity = (req, res, next) => {
  const headerUserId = req.headers['x-user-id'];
  const headerUserRole = req.headers['x-user-role'];
  const headerUserEmail = req.headers['x-user-email'];
  const headerUserCompany = req.headers['x-user-company']
    ? decodeURIComponent(req.headers['x-user-company'])
    : '';

  let user = null;

  if (headerUserId) {
    user = {
      userId: headerUserId,
      role: headerUserRole || 'customer',
      email: headerUserEmail || '',
      companyName: headerUserCompany || '',
    };
  } else {
    let token = null;
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = {
          userId: decoded.userId,
          role: decoded.role,
          email: decoded.email,
          companyName: decoded.companyName || '',
        };
      } catch (err) {
        user = null;
      }
    }
  }

  req.user = user;
  next();
};

export const requireAuth = (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in to proceed.',
    });
  }
  next();
};

export const requireMerchantOrAdmin = (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in to proceed.',
    });
  }

  if (req.user.role !== 'company' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: `Forbidden. Role '${req.user.role}' is not authorized for merchant operations.`,
    });
  }

  next();
};
