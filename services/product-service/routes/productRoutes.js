import express from 'express';
import multer from 'multer';
import {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  getMyCompanyProducts,
  updateProduct,
  deleteProduct,
  getCompanyStats,
  uploadImage,
} from '../controllers/productController.js';
import { requireCompany } from '../middleware/authCheck.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get('/categories', getCategories);
router.get('/company/mine', requireCompany, getMyCompanyProducts);
router.get('/company/stats', requireCompany, getCompanyStats);
router.post('/upload-image', requireCompany, upload.single('image'), uploadImage);

router.route('/')
  .get(getProducts)
  .post(requireCompany, createProduct);

router.route('/:id')
  .get(getProductById)
  .put(requireCompany, updateProduct)
  .delete(requireCompany, deleteProduct);

export default router;
