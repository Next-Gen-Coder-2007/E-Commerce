import Product from '../../models/Product.js';
import { generateEmbedding, cosineSimilarity } from './vectorEmbeddings.js';

export const SIGNAL_WEIGHTS = {
  PURCHASED: 5.0,
  CART_ITEM: 4.5,
  WISHLIST_ITEM: 4.0, // Explicit high-intent signal
  VIEWED_CATEGORY: 1.5,
};

/**
 * Multi-Signal Behavioral Recommendation Engine
 */
export class RecommendationEngine {
  /**
   * Generates personalized "Recommended For You" items
   * @param {Object} signals User cross-service signals: { wishlistProductIds, cartProductIds, purchasedProductIds, preferredCategories }
   * @param {number} limit Number of recommendations to return
   */
  static async getPersonalizedRecommendations(signals = {}, limit = 8) {
    const {
      wishlistProductIds = [],
      cartProductIds = [],
      purchasedProductIds = [],
      preferredCategories = [],
    } = signals;

    // Fetch candidate active products
    const allProducts = await Product.find({ isActive: { $ne: false }, stock: { $gt: 0 } })
      .select('title brand category price rating image stock discountPercentage description')
      .limit(100)
      .lean();

    if (!allProducts || allProducts.length === 0) return [];

    // Exclude items user already owns or has in cart
    const ownedOrInCart = new Set([...purchasedProductIds, ...cartProductIds]);
    const wishlistSet = new Set(wishlistProductIds);

    // Build user profile vector from positive intent items (Wishlist + Purchases + Cart)
    const seedIds = [...wishlistProductIds, ...cartProductIds, ...purchasedProductIds];
    const seedProducts = allProducts.filter((p) => seedIds.includes(String(p._id)));

    let profileVector = new Array(64).fill(0);
    if (seedProducts.length > 0) {
      for (const p of seedProducts) {
        const text = `${p.title} ${p.brand} ${p.category} ${p.description || ''}`;
        const vec = generateEmbedding(text);
        const weight = wishlistSet.has(String(p._id))
          ? SIGNAL_WEIGHTS.WISHLIST_ITEM
          : purchasedProductIds.includes(String(p._id))
          ? SIGNAL_WEIGHTS.PURCHASED
          : SIGNAL_WEIGHTS.CART_ITEM;

        for (let i = 0; i < 64; i++) {
          profileVector[i] += vec[i] * weight;
        }
      }
      // Normalize profile vector
      let norm = 0;
      for (let i = 0; i < 64; i++) norm += profileVector[i] * profileVector[i];
      norm = Math.sqrt(norm);
      if (norm > 0) {
        for (let i = 0; i < 64; i++) profileVector[i] /= norm;
      }
    }

    // Score candidates
    const scoredCandidates = allProducts
      .filter((p) => !ownedOrInCart.has(String(p._id)))
      .map((p) => {
        let score = 0;
        let matchReason = 'Trending Choice';

        // 1. Wishlist direct affinity
        if (wishlistSet.has(String(p._id))) {
          score += SIGNAL_WEIGHTS.WISHLIST_ITEM * 10;
          matchReason = 'On Your Wishlist';
        }

        // 2. Category / Brand affinity match
        if (preferredCategories.includes(p.category)) {
          score += SIGNAL_WEIGHTS.VIEWED_CATEGORY * 5;
          matchReason = `Popular in ${p.category}`;
        }

        // 3. Semantic Vector Similarity against user profile
        if (seedProducts.length > 0) {
          const productText = `${p.title} ${p.brand} ${p.category} ${p.description || ''}`;
          const productVector = generateEmbedding(productText);
          const sim = cosineSimilarity(profileVector, productVector);
          score += sim * 15;

          if (sim > 0.4 && matchReason === 'Trending Choice') {
            matchReason = 'Matches your taste & wishlist interests';
          }
        }

        // 4. Rating and discount boost
        score += (p.rating || 4.0) * 1.5;
        if ((p.discountPercentage || 0) > 10) score += 2.0;

        return {
          ...p,
          recommendationScore: Number(score.toFixed(2)),
          matchReason,
        };
      });

    scoredCandidates.sort((a, b) => b.recommendationScore - a.recommendationScore);
    return scoredCandidates.slice(0, Number(limit));
  }

  /**
   * Generates "Frequently Bought Together" bundles for a specific product
   * @param {string} targetProductId 
   * @param {number} limit 
   */
  static async getFrequentlyBoughtTogether(targetProductId, limit = 2) {
    const targetProduct = await Product.findById(targetProductId).lean();
    if (!targetProduct) return { mainProduct: null, bundleItems: [], bundlePrice: 0, savings: 0 };

    // Find complementary products in matching or cross-affinity categories
    const complementary = await Product.find({
      _id: { $ne: targetProduct._id },
      isActive: { $ne: false },
      stock: { $gt: 0 },
      $or: [
        { category: targetProduct.category },
        { brand: targetProduct.brand },
        { tags: { $in: targetProduct.tags || [] } },
      ],
    })
      .select('title brand category price rating image stock discountPercentage')
      .sort({ rating: -1, price: 1 })
      .limit(Number(limit))
      .lean();

    const items = complementary.map((item) => ({
      ...item,
      bundleDiscountPrice: Number((item.price * 0.9).toFixed(2)), // 10% bundle discount
    }));

    const rawTotal = targetProduct.price + items.reduce((sum, item) => sum + item.price, 0);
    const bundleTotal = targetProduct.price + items.reduce((sum, item) => sum + item.bundleDiscountPrice, 0);
    const savings = rawTotal - bundleTotal;

    return {
      mainProduct: targetProduct,
      bundleItems: items,
      rawTotal: Number(rawTotal.toFixed(2)),
      bundlePrice: Number(bundleTotal.toFixed(2)),
      savings: Number(savings.toFixed(2)),
      bundleDiscountPct: 10,
    };
  }
}

export default RecommendationEngine;
