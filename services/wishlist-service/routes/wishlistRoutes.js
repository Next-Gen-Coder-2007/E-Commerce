import express from 'express';
import {
  getWishlist,
  addItemToWishlist,
  removeItemFromWishlist,
  moveToCart,
  getSharedWishlist,
  toggleWishlistPrivacy,
  clearWishlist,
} from '../controllers/wishlistController.js';
import { attachUser, requireAuth } from '../middleware/authCheck.js';

const router = express.Router();

// Public shared registry
router.get('/shared/:shareToken', getSharedWishlist);

// Authenticated customer wishlist operations
router.get('/', attachUser, requireAuth, getWishlist);
router.post('/items', attachUser, requireAuth, addItemToWishlist);
router.delete('/items/:productId', attachUser, requireAuth, removeItemFromWishlist);
router.post('/items/:productId/move-to-cart', attachUser, requireAuth, moveToCart);
router.patch('/privacy', attachUser, requireAuth, toggleWishlistPrivacy);
router.delete('/', attachUser, requireAuth, clearWishlist);

export default router;
