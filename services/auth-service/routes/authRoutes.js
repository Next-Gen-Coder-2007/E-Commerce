import express from 'express';
import {
  registerUser,
  loginUser,
  googleAuth,
  logoutUser,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authRateLimiter, registerUser);
router.post('/login', authRateLimiter, loginUser);
router.post('/google', authRateLimiter, googleAuth);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

export default router;
