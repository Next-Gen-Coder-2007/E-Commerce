import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { generateToken, clearToken } from '../utils/jwt.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
  companyName: user.companyName || '',
  avatar: user.avatar || '',
  savedAddresses: user.savedAddresses || [],
  businessDetails: user.businessDetails || {},
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

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
      if (userExists.role === 'company') {
        return res.status(400).json({
          success: false,
          message:
            'This email is already registered as a merchant/business account. Please sign in at the Merchant Portal.',
        });
      }
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please sign in.',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role || 'customer',
      companyName: role === 'company' ? (companyName ? companyName.trim() : '') : '',
    });

    generateToken(res, user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password, portal = 'customer' } = req.body;

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

    generateToken(res, user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { credential, portal = 'customer' } = req.body;

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
      // If user logs in from merchant portal and is not a company, upgrade them to merchant
      if (portal === 'business' && user.role === 'customer') {
        user.role = 'company';
        if (!user.companyName) {
          user.companyName = `${user.name || 'Merchant'} Store`;
        }
      }

      let updated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        updated = true;
      }
      if (updated || portal === 'business') {
        await user.save();
      }
    } else {
      user = await User.create({
        name: name || 'Google User',
        email: normalizedEmail,
        googleId,
        avatar: picture || '',
        role: portal === 'business' ? 'company' : 'customer',
        companyName: portal === 'business' ? `${name || 'Merchant'} Store` : '',
      });
    }

    generateToken(res, user);

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      user: sanitizeUser(user),
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
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
    });
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { name, phone, avatar } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const updateBusinessDetails = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const {
      companyName,
      taxId,
      supportEmail,
      supportPhone,
      website,
      storeDescription,
      businessAddress,
      bankDetails,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Merchant user not found',
      });
    }

    if (user.role !== 'company' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only registered business accounts can update business details',
      });
    }

    if (companyName) {
      user.companyName = companyName.trim();
    }

    if (!user.businessDetails) {
      user.businessDetails = {};
    }

    if (taxId !== undefined) user.businessDetails.taxId = taxId.trim();
    if (supportEmail !== undefined) user.businessDetails.supportEmail = supportEmail.trim();
    if (supportPhone !== undefined) user.businessDetails.supportPhone = supportPhone.trim();
    if (website !== undefined) user.businessDetails.website = website.trim();
    if (storeDescription !== undefined) user.businessDetails.storeDescription = storeDescription.trim();

    if (businessAddress) {
      user.businessDetails.businessAddress = {
        ...user.businessDetails.businessAddress,
        ...businessAddress,
      };
    }

    if (bankDetails) {
      user.businessDetails.bankDetails = {
        ...user.businessDetails.bankDetails,
        ...bankDetails,
      };
    }

    user.markModified('businessDetails');
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Business account and payout details updated successfully',
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const addSavedAddress = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const {
      label = 'Home',
      fullName,
      phone,
      addressLine1,
      addressLine2 = '',
      city,
      state,
      postalCode,
      country = 'United States',
      isDefault = false,
    } = req.body;

    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, contact phone number, street address, city, state, and postal code',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.savedAddresses) {
      user.savedAddresses = [];
    }

    const setAsDefault = isDefault || user.savedAddresses.length === 0;

    if (setAsDefault) {
      user.savedAddresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.savedAddresses.push({
      label: label.trim(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: (addressLine2 || '').trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: (country || 'United States').trim(),
      isDefault: setAsDefault,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Address saved to profile successfully',
      savedAddresses: user.savedAddresses,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const updateSavedAddress = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { addressId } = req.params;
    const {
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const addrIndex = user.savedAddresses.findIndex(
      (a) => a._id.toString() === addressId.toString()
    );

    if (addrIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found in address book',
      });
    }

    if (fullName) user.savedAddresses[addrIndex].fullName = fullName.trim();
    if (phone) user.savedAddresses[addrIndex].phone = phone.trim();
    if (label) user.savedAddresses[addrIndex].label = label.trim();
    if (addressLine1) user.savedAddresses[addrIndex].addressLine1 = addressLine1.trim();
    if (addressLine2 !== undefined) user.savedAddresses[addrIndex].addressLine2 = addressLine2.trim();
    if (city) user.savedAddresses[addrIndex].city = city.trim();
    if (state) user.savedAddresses[addrIndex].state = state.trim();
    if (postalCode) user.savedAddresses[addrIndex].postalCode = postalCode.trim();
    if (country) user.savedAddresses[addrIndex].country = country.trim();

    if (isDefault) {
      user.savedAddresses.forEach((a) => {
        a.isDefault = false;
      });
      user.savedAddresses[addrIndex].isDefault = true;
    }

    user.markModified('savedAddresses');
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      savedAddresses: user.savedAddresses,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSavedAddress = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.savedAddresses = user.savedAddresses.filter(
      (addr) => addr._id.toString() !== addressId.toString()
    );

    if (user.savedAddresses.length > 0 && !user.savedAddresses.some((a) => a.isDefault)) {
      user.savedAddresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Address removed successfully',
      savedAddresses: user.savedAddresses,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const setDefaultAddress = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let found = false;
    user.savedAddresses.forEach((addr) => {
      if (addr._id.toString() === addressId.toString()) {
        addr.isDefault = true;
        found = true;
      } else {
        addr.isDefault = false;
      }
    });

    if (!found) {
      return res.status(404).json({
        success: false,
        message: 'Address not found in address book',
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Default address updated successfully',
      savedAddresses: user.savedAddresses,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};
