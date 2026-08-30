import jwt from 'jsonwebtoken';

export const generateToken = (res, userPayload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  const payload =
    typeof userPayload === 'object' && userPayload !== null
      ? {
          userId: (userPayload._id || userPayload.id || userPayload.userId).toString(),
          role: userPayload.role || 'customer',
          email: userPayload.email,
          companyName: userPayload.companyName || '',
        }
      : {
          userId: userPayload.toString(),
          role: 'customer',
        };

  const token = jwt.sign(payload, secret, {
    expiresIn: '7d',
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  return token;
};

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
