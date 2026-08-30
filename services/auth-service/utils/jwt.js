import jwt from 'jsonwebtoken';

/**
 * Generates a signed JWT and attaches it to the response as a secure HTTP-only cookie.
 * @param {import('express').Response} res - Express response object
 * @param {string} userId - User ID to encode in token
 * @returns {string} - Generated JWT token
 */
export const generateToken = (res, userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  const token = jwt.sign({ userId }, secret, {
    expiresIn: '7d',
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  return token;
};

/**
 * Clears the authentication JWT cookie from response.
 * @param {import('express').Response} res - Express response object
 */
export const clearToken = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
};
