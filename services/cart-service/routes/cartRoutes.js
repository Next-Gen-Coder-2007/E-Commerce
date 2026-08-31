import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeCart,
} from '../controllers/cartController.js';
import { attachCartIdentity } from '../middleware/authCheck.js';

const router = express.Router();

router.use(attachCartIdentity);

router.route('/')
  .get(getCart)
  .post(addToCart)
  .delete(clearCart);

router.post('/items', addToCart);
router.route('/items/:productId')
  .put(updateCartItem)
  .delete(removeCartItem);

router.post('/merge', mergeCart);

export default router;
