import express from 'express';
import multer from 'multer';
import {
  getProducts,
  getProductById,
  getCategories,
  getTaxonomy,
  createProduct,
  getMyCompanyProducts,
  updateProduct,
  deleteProduct,
  getCompanyStats,
  uploadImage,
  getCompanyStorefront,
  getStorefrontSettings,
  updateStorefrontSettings,
  applyBulkDiscount,
  syncProductRating,
} from '../controllers/productController.js';
import { requireCompany } from '../middleware/authCheck.js';
import searchRoutes from '../modules/search-module/searchRoutes.js';
import recommendationRoutes from '../modules/recommendation-module/recommendationRoutes.js';
import assistantRoutes from '../modules/ai-assistant/assistantRoutes.js';

const router = express.Router();

// Search & Faceted Discovery Routes
router.use('/search', searchRoutes);

// AI Semantic Recommendations Routes
router.use('/recommendations', recommendationRoutes);

// AI Shopping Assistant Concierge Routes
router.use('/ai-assistant', assistantRoutes);

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
router.get('/taxonomy', getTaxonomy);
router.get('/storefront/:companyIdentifier', getCompanyStorefront);
router.get('/company/storefront-settings', requireCompany, getStorefrontSettings);
router.put('/company/storefront-settings', requireCompany, updateStorefrontSettings);
router.post('/company/bulk-discount', requireCompany, applyBulkDiscount);
router.get('/company/mine', requireCompany, getMyCompanyProducts);
router.get('/company/stats', requireCompany, getCompanyStats);
router.post('/upload-image', requireCompany, handleImageUpload, uploadImage);
router.put('/:id/rating-sync', syncProductRating);

router.route('/')
  .get(getProducts)
  .post(requireCompany, createProduct);

router.route('/:id')
  .get(getProductById)
  .put(requireCompany, updateProduct)
  .delete(requireCompany, deleteProduct);

export default router;
