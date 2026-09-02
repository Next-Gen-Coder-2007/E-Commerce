import Product from '../../models/Product.js';
import RecommendationEngine from './recommendationEngine.js';
import HybridSearchEngine from './hybridSearch.js';
import { sendSuccess, sendError } from '../../utils/responseEnvelope.js';

/**
 * @desc Get personalized "For You" recommendations
 * @route GET /api/products/recommendations/for-you
 * @access Public / Private
 */
export const getForYouRecommendations = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 8;
    const wishlistIds = req.query.wishlist ? req.query.wishlist.split(',') : [];
    const cartIds = req.query.cart ? req.query.cart.split(',') : [];
    const categories = req.query.categories ? req.query.categories.split(',') : [];

    const recommendations = await RecommendationEngine.getPersonalizedRecommendations(
      {
        wishlistProductIds: wishlistIds,
        cartProductIds: cartIds,
        preferredCategories: categories,
      },
      limit
    );

    return sendSuccess(res, {
      statusCode: 200,
      data: {
        recommendations,
        total: recommendations.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get "Frequently Bought Together" bundles for a product
 * @route GET /api/products/recommendations/frequently-bought-together/:productId
 * @access Public
 */
export const getFrequentlyBoughtTogether = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 2;

    const bundle = await RecommendationEngine.getFrequentlyBoughtTogether(productId, limit);

    if (!bundle.mainProduct) {
      return sendError(res, {
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Main product not found',
      });
    }

    return sendSuccess(res, {
      statusCode: 200,
      data: bundle,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Execute AI Semantic Hybrid Vector Search
 * @route GET /api/products/search/semantic
 * @access Public
 */
export const executeSemanticHybridSearch = async (req, res, next) => {
  try {
    const { q, limit = 12 } = req.query;
    if (!q || !q.trim()) {
      return sendError(res, {
        statusCode: 400,
        code: 'QUERY_REQUIRED',
        message: 'Search query parameter q is required',
      });
    }

    const allProducts = await Product.find({ isActive: { $ne: false } })
      .select('title brand category price rating image stock discountPercentage description')
      .limit(200)
      .lean();

    const hybridRanked = HybridSearchEngine.rankHybrid(q, allProducts).slice(0, parseInt(limit, 10));

    return sendSuccess(res, {
      statusCode: 200,
      data: {
        query: q,
        results: hybridRanked,
        totalResults: hybridRanked.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
