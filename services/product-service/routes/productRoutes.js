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
  limits: { fileSize: 500 * 1024 }, // 500 KB limit
});

const handleImageUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Image size exceeds 500KB limit',
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading image',
      });
    }
    next();
  });
};

router.get('/categories', getCategories);
router.get('/company/mine', requireCompany, getMyCompanyProducts);
router.get('/company/stats', requireCompany, getCompanyStats);
router.post('/upload-image', requireCompany, handleImageUpload, uploadImage);

router.route('/')
  .get(getProducts)
  .post(requireCompany, createProduct);

router.route('/:id')
  .get(getProductById)
  .put(requireCompany, updateProduct)
  .delete(requireCompany, deleteProduct);

export default router;
