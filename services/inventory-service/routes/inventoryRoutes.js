import express from 'express';
import {
  reserveStock,
  commitReservation,
  releaseReservation,
  getProductStock,
  restockItem,
  getMerchantInventory,
} from '../controllers/inventoryController.js';
import { attachUser, requireCompany } from '../middleware/authCheck.js';

const router = express.Router();

// Two-Phase Distributed Reservation Endpoints (Internal / Saga)
router.post('/reserve', attachUser, reserveStock);
router.post('/commit', attachUser, commitReservation);
router.post('/release', attachUser, releaseReservation);

// Stock queries
router.get('/product/:productId', getProductStock);

// Merchant Inventory Management
router.get('/company/mine', requireCompany, getMerchantInventory);
router.post('/restock', requireCompany, restockItem);

export default router;
