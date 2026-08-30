import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { generateToken, clearToken } from '../utils/jwt.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, role = 'customer', companyName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const allowedRoles = ['customer', 'company'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selection. Only customer or company accounts can be created.',
      });
    }

    if (role === 'company' && (!companyName || !companyName.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a company / business name for company accounts',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role || 'customer',
      companyName: role === 'company' ? (companyName ? companyName.trim() : '') : '',
    });

    generateToken(res, user._id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.password && user.googleId) {
      return res.status(400).json({
        success: false,
        message:
          'This account was registered via Google Sign-In. Please sign in with Google.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    generateToken(res, user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential token is required',
      });
    }

    let payload;

    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId || undefined,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error('[Auth Service] Google token verification error:', verifyErr.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google authentication token',
      });
    }

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Unable to retrieve user information from Google',
      });
    }

    const { email, name, picture, sub: googleId } = payload;
    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    } else {
      user = await User.create({
        name: name || 'Google User',
        email: normalizedEmail,
        googleId,
        avatar: picture || '',
        role: 'customer',
      });
    }

    generateToken(res, user._id);

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res) => {
  clearToken(res);
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};
