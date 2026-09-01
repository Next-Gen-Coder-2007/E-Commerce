import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const extractUserContext = async (req) => {
  const headerUserId = req.headers['x-user-id'];
  const headerUserRole = req.headers['x-user-role'];
  const headerUserEmail = req.headers['x-user-email'];
  const headerUserCompany = req.headers['x-user-company']
    ? decodeURIComponent(req.headers['x-user-company'])
    : undefined;

  let user = null;

  if (headerUserId && headerUserRole) {
    user = {
      userId: headerUserId,
      role: headerUserRole,
      email: headerUserEmail,
      companyName: headerUserCompany,
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
          companyName: decoded.companyName,
        };
      } catch (e) {
        user = null;
      }
    }
  }

  return user;
};

export const attachUser = async (req, res, next) => {
  req.user = await extractUserContext(req);
  next();
};

export const requireAuth = async (req, res, next) => {
  const user = await extractUserContext(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required to perform this action',
    });
  }
  req.user = user;
  next();
};

export const requireCompany = async (req, res, next) => {
  const user = await extractUserContext(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in to your company account.',
    });
  }

  if (user.role !== 'company' && user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Only registered company or merchant accounts can perform this action.',
    });
  }

  req.user = user;
  next();
};

export const requireCustomer = async (req, res, next) => {
  const user = await extractUserContext(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Please sign in to submit customer feedback.',
    });
  }

  if (user.role === 'company') {
    return res.status(403).json({
      success: false,
      message: 'Merchant accounts cannot perform customer shopper actions.',
    });
  }

  req.user = user;
  next();
};
