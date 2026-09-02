import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/responseEnvelope.js';

/**
 * @desc Get all platform users with search and filtering
 * @route GET /api/auth/admin/users
 * @access Private (Admin)
 */
export const getAdminUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const { role, status, search, verified } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (verified !== undefined && verified !== 'all') {
      query.isVerifiedCompany = verified === 'true';
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { companyName: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    return sendSuccess(res, {
      statusCode: 200,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update user role
 * @route PATCH /api/auth/admin/users/:id/role
 * @access Private (Admin)
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['customer', 'company', 'admin'].includes(role)) {
      return sendError(res, {
        statusCode: 400,
        code: 'INVALID_ROLE',
        message: 'Role must be one of customer, company, or admin',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    user.role = role;
    await user.save();

    return sendSuccess(res, {
      statusCode: 200,
      message: `User role successfully changed to ${role}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update user status (active, suspended, banned)
 * @route PATCH /api/auth/admin/users/:id/status
 * @access Private (Admin)
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'banned'].includes(status)) {
      return sendError(res, {
        statusCode: 400,
        code: 'INVALID_STATUS',
        message: 'Status must be active, suspended, or banned',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    user.status = status;
    await user.save();

    return sendSuccess(res, {
      statusCode: 200,
      message: `User status updated to ${status}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Toggle merchant store verification license
 * @route PATCH /api/auth/admin/users/:id/verification
 * @access Private (Admin)
 */
export const updateMerchantVerification = async (req, res, next) => {
  try {
    const { isVerifiedCompany } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    user.isVerifiedCompany = Boolean(isVerifiedCompany);
    await user.save();

    return sendSuccess(res, {
      statusCode: 200,
      message: `Merchant verification status updated to ${user.isVerifiedCompany}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get platform user statistics
 * @route GET /api/auth/admin/stats
 * @access Private (Admin)
 */
export const getAdminUserStats = async (req, res, next) => {
  try {
    const [totalUsers, customerCount, companyCount, adminCount, unverifiedCompanies, bannedUsers] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'customer' }),
        User.countDocuments({ role: 'company' }),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ role: 'company', isVerifiedCompany: { $ne: true } }),
        User.countDocuments({ status: 'banned' }),
      ]);

    return sendSuccess(res, {
      statusCode: 200,
      data: {
        totalUsers,
        customerCount,
        companyCount,
        adminCount,
        unverifiedCompanies,
        bannedUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};
