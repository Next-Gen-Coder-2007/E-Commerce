import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const attachCartIdentity = (req, res, next) => {
  const headerUserId = req.headers['x-user-id'];
  const headerUserRole = req.headers['x-user-role'];
  const headerUserEmail = req.headers['x-user-email'];

  let user = null;

  if (headerUserId) {
    user = {
      userId: headerUserId,
      role: headerUserRole || 'customer',
      email: headerUserEmail || '',
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
        };
      } catch (err) {
        user = null;
      }
    }
  }

  req.user = user;

  let guestId =
    req.headers['x-guest-cart-id'] ||
    req.cookies?.guestCartId ||
    req.query?.guestId;

  if (!guestId && !user) {
    guestId = `guest_${crypto.randomUUID()}`;
  }

  req.guestId = guestId || null;

  next();
};

export const requireAuth = (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required for this cart action',
    });
  }
  next();
};
