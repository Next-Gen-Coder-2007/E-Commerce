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
import { protect } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

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

export default router;
