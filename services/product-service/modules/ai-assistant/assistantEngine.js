import Product from '../../models/Product.js';
import { generateEmbedding, cosineSimilarity } from '../recommendation-module/vectorEmbeddings.js';

/**
 * AI Shopping Concierge & Natural Language Intent Parser
 */
export class AiAssistantEngine {
  /**
   * Extracts shopping constraints (budget, category, brand, attributes) from natural language query
   * @param {string} prompt User message
   * @returns {Object} Extracted constraints
   */
  static extractConstraints(prompt = '') {
    const text = prompt.toLowerCase();
    const constraints = {
      minPrice: null,
      maxPrice: null,
      category: null,
      brand: null,
      keywords: [],
      qualities: [],
    };

    // 1. Price boundaries (e.g. "under $500", "less than 200", "between 100 and 300")
    const underMatch = text.match(/(?:under|less than|below|max|cheaper than)\s*\$?(\d+(?:\.\d+)?)/i);
    if (underMatch) constraints.maxPrice = parseFloat(underMatch[1]);

    const aboveMatch = text.match(/(?:above|more than|over|greater than|at least)\s*\$?(\d+(?:\.\d+)?)/i);
    if (aboveMatch) constraints.minPrice = parseFloat(aboveMatch[1]);

    const betweenMatch = text.match(/(?:between|from)\s*\$?(\d+)\s*(?:and|to)\s*\$?(\d+)/i);
    if (betweenMatch) {
      constraints.minPrice = parseFloat(betweenMatch[1]);
      constraints.maxPrice = parseFloat(betweenMatch[2]);
    }

    // 2. Known category mapping (singular & plural stems)
    const categoryPatterns = [
      { cat: 'laptops', words: ['laptop', 'notebook', 'macbook', 'pc', 'computer'] },
      { cat: 'smartphones', words: ['phone', 'smartphone', 'iphone', 'galaxy', 'mobile', 'cellular'] },
      { cat: 'audio', words: ['audio', 'headphone', 'earphone', 'earbud', 'speaker', 'soundbar'] },
      { cat: 'electronics', words: ['electronic', 'gadget', 'screen', 'monitor', 'tv', 'camera'] },
      { cat: 'fashion', words: ['fashion', 'apparel', 'shirt', 'dress', 'jacket', 'coat', 'shoe', 'sneaker', 'clothing'] },
      { cat: 'home', words: ['home', 'living', 'furniture', 'decor', 'kitchen', 'lamp', 'desk'] },
      { cat: 'beauty', words: ['beauty', 'skincare', 'cosmetic', 'perfume', 'serum', 'lotion'] },
      { cat: 'sports', words: ['sport', 'outdoor', 'fitness', 'gym', 'workout', 'yoga'] },
      { cat: 'books', words: ['book', 'novel', 'read', 'author'] },
    ];

    for (const item of categoryPatterns) {
      if (item.words.some((w) => text.includes(w))) {
        constraints.category = item.cat;
        break;
      }
    }

    // 3. Known brand mapping
    const brands = ['Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Dell', 'LG', 'Bose', 'Logitech', 'Asus'];
    for (const b of brands) {
      if (text.includes(b.toLowerCase())) {
        constraints.brand = b;
        break;
      }
    }

    // 4. Qualitative features
    const featureKeywords = ['gaming', 'noise cancelling', 'wireless', 'bluetooth', 'lightweight', 'waterproof', 'pro', 'gift', 'budget', 'premium'];
    for (const feat of featureKeywords) {
      if (text.includes(feat)) {
        constraints.qualities.push(feat);
      }
    }

    return constraints;
  }

  /**
   * Generates grounded AI shopping recommendations and structured conversational reply
   * @param {string} userMessage Current user message
   * @param {Array<Object>} history Previous chat messages
   */
  static async processChat(userMessage = '', history = []) {
    const constraints = this.extractConstraints(userMessage);

    // Dynamically check live database brands if not matched statically
    if (!constraints.brand) {
      try {
        const liveBrands = await Product.distinct('brand', { isActive: { $ne: false } });
        const lowerMsg = userMessage.toLowerCase();
        for (const b of liveBrands) {
          if (b && lowerMsg.includes(b.toLowerCase())) {
            constraints.brand = b;
            break;
          }
        }
      } catch (err) {
        // Continue with static constraints
      }
    }

    // Build database search query from constraints
    const filter = { isActive: { $ne: false }, stock: { $gt: 0 } };
    const andClauses = [];

    if (constraints.maxPrice !== null) {
      andClauses.push({ price: { $lte: constraints.maxPrice } });
    }
    if (constraints.minPrice !== null) {
      andClauses.push({ price: { $gte: constraints.minPrice } });
    }
    if (constraints.category) {
      andClauses.push({ category: new RegExp(`^${constraints.category}$`, 'i') });
    }
    if (constraints.brand) {
      andClauses.push({ brand: new RegExp(`^${constraints.brand}$`, 'i') });
    }

    if (andClauses.length > 0) {
      filter.$and = andClauses;
    }

    // Fetch candidate products
    let candidates = await Product.find(filter)
      .select('title brand category price rating image stock discountPercentage description')
      .limit(30)
      .lean();

    // Fallback: If strict filter returns 0 products, relax brand/category and run semantic vector search
    if (candidates.length === 0) {
      candidates = await Product.find({ isActive: { $ne: false }, stock: { $gt: 0 } })
        .select('title brand category price rating image stock discountPercentage description')
        .limit(50)
        .lean();
    }

    // Rank candidates using semantic cosine similarity against user query
    const queryVector = generateEmbedding(userMessage);
    const scoredCandidates = candidates.map((p) => {
      const pText = `${p.title} ${p.brand} ${p.category} ${p.description || ''}`;
      const pVector = generateEmbedding(pText);
      const similarity = cosineSimilarity(queryVector, pVector);

      let score = similarity * 10;
      if (constraints.brand && p.brand?.toLowerCase() === constraints.brand.toLowerCase()) score += 5;
      if (constraints.category && p.category?.toLowerCase() === constraints.category.toLowerCase()) score += 4;
      if (constraints.maxPrice && p.price <= constraints.maxPrice) score += 3;

      return { ...p, score: Number(score.toFixed(2)), similarity: Number(similarity.toFixed(3)) };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);
    const topProducts = scoredCandidates.slice(0, 4);

    // Synthesize natural conversational response
    let replyText = '';
    if (topProducts.length > 0) {
      const best = topProducts[0];
      if (constraints.maxPrice && constraints.brand) {
        replyText = `I found excellent **${constraints.brand}** options for you under **$${constraints.maxPrice}**. My top recommendation is the **${best.title}** priced at **$${best.price.toFixed(2)}** with a **${best.rating || 4.5}/5** rating.`;
      } else if (constraints.category) {
        replyText = `Here are the highest-rated picks in our **${constraints.category}** collection matching your criteria. Take a look at the curated options below:`;
      } else if (constraints.maxPrice) {
        replyText = `Here are standout items staying comfortably under your budget of **$${constraints.maxPrice}**:`;
      } else {
        replyText = `I searched our entire marketplace catalog for *"${userMessage}"*. Here are the best matches curated for you:`;
      }
    } else {
      replyText = `I couldn't find an exact match for that specific criteria right now, but here are some of our most popular bestselling items on the platform!`;
    }

    return {
      reply: replyText,
      products: topProducts,
      extractedConstraints: constraints,
      suggestedFollowUps: [
        'Filter by highest customer rating',
        'Show items with instant discounts',
        'Add top recommendation to my cart',
      ],
    };
  }
}

export default AiAssistantEngine;
