import * as baseCatalogController from '../../controllers/productController.js';
import { sendSuccess, sendError } from '../../utils/responseEnvelope.js';

export const {
  attachCalculatedRatings,
  getProducts,
  getCompanyStorefront,
  getProductById,
  getCategories,
  createProduct,
  getMyCompanyProducts,
  updateProduct,
  deleteProduct,
  getCompanyStats,
  uploadImage,
  getStorefrontSettings,
  updateStorefrontSettings,
  applyBulkDiscount,
  syncProductRating,
} = baseCatalogController;

export default {
  ...baseCatalogController,
  sendSuccess,
  sendError,
};
