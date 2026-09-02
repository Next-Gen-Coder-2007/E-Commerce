import express from 'express';
import {
  registerUser,
  loginUser,
  googleAuth,
  logoutUser,
  getMe,
  updateProfile,
  updateBusinessDetails,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
  setDefaultAddress,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import {
  getAdminUsers,
  updateUserRole,
  updateUserStatus,
  updateMerchantVerification,
  getAdminUserStats,
} from '../controllers/adminUserController.js';

const router = express.Router();

router.post('/register', authRateLimiter, registerUser);
router.post('/login', authRateLimiter, loginUser);
router.post('/google', authRateLimiter, googleAuth);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

// User Profile & Saved Addresses
router.put('/profile', protect, updateProfile);
router.put('/business-details', protect, updateBusinessDetails);
router.post('/addresses', protect, addSavedAddress);
router.put('/addresses/:addressId', protect, updateSavedAddress);
router.delete('/addresses/:addressId', protect, deleteSavedAddress);
router.put('/addresses/:addressId/default', protect, setDefaultAddress);

// ==========================================
// Admin User Management Endpoints
// ==========================================
router.get('/admin/stats', protect, authorize('admin'), getAdminUserStats);
router.get('/admin/users', protect, authorize('admin'), getAdminUsers);
router.patch('/admin/users/:id/role', protect, authorize('admin'), updateUserRole);
router.patch('/admin/users/:id/status', protect, authorize('admin'), updateUserStatus);
router.patch('/admin/users/:id/verification', protect, authorize('admin'), updateMerchantVerification);

export default router;
