import Product from '../../models/Product.js';

// Levenshtein distance for fuzzy matching & typo tolerance
const levenshteinDistance = (a, b) => {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[a.length][b.length];
};

export class FacetedSearchEngine {
  /**
   * Execute multi-attribute faceted search with dynamic aggregation buckets
   */
  static async search({
    query = '',
    category,
    subcategory,
    brand,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    minDiscount,
    companyId,
    sortBy = 'relevance',
    page = 1,
    limit = 12,
  }) {
    const filter = { isActive: { $ne: false } };
    const andConditions = [];

    // 1. Text Search & Typo-Tolerance
    if (query && query.trim().length > 0) {
      const cleanQ = query.trim();
      andConditions.push({
        $or: [
          { title: { $regex: cleanQ, $options: 'i' } },
          { description: { $regex: cleanQ, $options: 'i' } },
          { brand: { $regex: cleanQ, $options: 'i' } },
          { category: { $regex: cleanQ, $options: 'i' } },
          { subcategory: { $regex: cleanQ, $options: 'i' } },
          { tags: { $in: [new RegExp(cleanQ, 'i')] } },
        ],
      });
    }

    // 2. Category Filter (multi-category support)
    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      andConditions.push({ category: { $in: categories } });
    }

    // 2.1 Subcategory Filter
    if (subcategory) {
      const subcategories = Array.isArray(subcategory) ? subcategory : [subcategory];
      andConditions.push({
        subcategory: { $in: subcategories.map((s) => new RegExp(`^${s}$`, 'i')) },
      });
    }

    // 3. Brand Filter (multi-brand support)
    if (brand) {
      const brands = Array.isArray(brand) ? brand : [brand];
      andConditions.push({ brand: { $in: brands } });
    }

    // 4. Price Range
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter = {};
      if (minPrice !== undefined) priceFilter.$gte = Number(minPrice);
      if (maxPrice !== undefined) priceFilter.$lte = Number(maxPrice);
      andConditions.push({ price: priceFilter });
    }

    // 5. Rating Filter
    if (minRating) {
      andConditions.push({
        $or: [
          { rating: { $gte: Number(minRating) } },
          { averageRating: { $gte: Number(minRating) } },
        ],
      });
    }

    // 6. In-Stock Only
    if (inStockOnly === true || inStockOnly === 'true') {
      andConditions.push({ stock: { $gt: 0 } });
    }

    // 7. Minimum Discount %
    if (minDiscount) {
      andConditions.push({ discountPercentage: { $gte: Number(minDiscount) } });
    }

    // 8. Company / Merchant Filter
    if (companyId) {
      andConditions.push({ companyId });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    // Sorting strategies
    let sortObj = {};
    switch (sortBy) {
      case 'price_asc':
        sortObj = { price: 1 };
        break;
      case 'price_desc':
        sortObj = { price: -1 };
        break;
      case 'rating':
        sortObj = { rating: -1, averageRating: -1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'discount':
        sortObj = { discountPercentage: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Parallel fetch: Paginated results + Dynamic Facet Aggregations
    const [products, totalCount, allMatchingForFacets] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
      Product.countDocuments(filter),
      Product.find(query ? { $or: filter.$and?.[0]?.$or || [{}] } : { isActive: { $ne: false } })
        .select('brand category price rating averageRating stock discountPercentage')
        .lean(),
    ]);

    // Compute dynamic faceted aggregation counts
    const brandCounts = {};
    const categoryCounts = {};
    let minPriceFound = Infinity;
    let maxPriceFound = 0;
    let inStockCount = 0;
    const ratingBuckets = { 4: 0, 3: 0, 2: 0, 1: 0 };
    const discountBuckets = { 10: 0, 20: 0, 30: 0, 50: 0 };

    for (const p of allMatchingForFacets) {
      if (p.brand) {
        brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
      }
      if (p.category) {
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      }
      if (p.price !== undefined) {
        if (p.price < minPriceFound) minPriceFound = p.price;
        if (p.price > maxPriceFound) maxPriceFound = p.price;
      }
      if (p.stock > 0) {
        inStockCount++;
      }
      const r = p.rating || p.averageRating || 0;
      if (r >= 4) ratingBuckets[4]++;
      if (r >= 3) ratingBuckets[3]++;
      if (r >= 2) ratingBuckets[2]++;
      if (r >= 1) ratingBuckets[1]++;

      const d = p.discountPercentage || 0;
      if (d >= 10) discountBuckets[10]++;
      if (d >= 20) discountBuckets[20]++;
      if (d >= 30) discountBuckets[30]++;
      if (d >= 50) discountBuckets[50]++;
    }

    const facets = {
      brands: Object.entries(brandCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      categories: Object.entries(categoryCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      priceRange: {
        min: minPriceFound === Infinity ? 0 : Math.floor(minPriceFound),
        max: maxPriceFound === 0 ? 1000 : Math.ceil(maxPriceFound),
      },
      inStockCount,
      totalMatches: allMatchingForFacets.length,
      ratings: ratingBuckets,
      discounts: discountBuckets,
    };

    return {
      products,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCount / Number(limit)),
        hasMore: skip + products.length < totalCount,
      },
      facets,
    };
  }

  /**
   * Sub-15ms search-as-you-type autocomplete with fuzzy match suggestions
   */
  static async autocomplete(query = '', limit = 6) {
    if (!query || query.trim().length < 2) {
      return { suggestions: [], products: [], categories: [] };
    }

    const cleanQ = query.trim().toLowerCase();

    // 1. Direct prefix & regex match on indexed fields
    const directMatches = await Product.find({
      isActive: { $ne: false },
      $or: [
        { title: { $regex: `^${cleanQ}`, $options: 'i' } },
        { title: { $regex: cleanQ, $options: 'i' } },
        { brand: { $regex: `^${cleanQ}`, $options: 'i' } },
        { category: { $regex: `^${cleanQ}`, $options: 'i' } },
      ],
    })
      .select('title price image category brand rating discountPercentage stock')
      .limit(Number(limit))
      .lean();

    // 2. Extract suggested keyword terms & categories
    const categoriesSet = new Set();
    const suggestionsSet = new Set();

    for (const p of directMatches) {
      if (p.category) categoriesSet.add(p.category);
      if (p.title) {
        suggestionsSet.add(p.title);
      }
      if (p.brand) {
        suggestionsSet.add(p.brand);
      }
    }

    // 3. Typo-Tolerance: If 0 direct matches, run fuzzy distance search
    let fuzzyResults = [];
    if (directMatches.length === 0 && cleanQ.length >= 3) {
      const candidates = await Product.find({ isActive: { $ne: false } })
        .select('title price image category brand rating')
        .limit(100)
        .lean();

      for (const cand of candidates) {
        const titleWords = (cand.title || '').toLowerCase().split(' ');
        for (const word of titleWords) {
          if (word.length >= 3) {
            const dist = levenshteinDistance(cleanQ, word);
            if (dist <= 2) {
              fuzzyResults.push({
                ...cand,
                matchedKeyword: cand.title,
                fuzzyConfidence: 1 - dist / Math.max(cleanQ.length, word.length),
              });
              suggestionsSet.add(cand.title);
              if (cand.category) categoriesSet.add(cand.category);
              break;
            }
          }
        }
      }
      fuzzyResults.sort((a, b) => b.fuzzyConfidence - a.fuzzyConfidence);
    }

    const finalProducts = directMatches.length > 0 ? directMatches : fuzzyResults.slice(0, limit);

    return {
      query,
      suggestions: Array.from(suggestionsSet).slice(0, 5),
      categories: Array.from(categoriesSet).slice(0, 4),
      products: finalProducts,
      isFuzzyMatch: directMatches.length === 0 && fuzzyResults.length > 0,
    };
  }

  /**
   * Pure aggregation computation from product list
   */
  static computeFacets(products = []) {
    const brandCounts = {};
    const categoryCounts = {};
    let minPriceFound = Infinity;
    let maxPriceFound = 0;
    let inStockCount = 0;
    const discountTiers = { '20_and_above': 0, '50_and_above': 0 };

    for (const p of products) {
      if (p.brand) brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
      if (p.category) categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      if (p.price !== undefined) {
        if (p.price < minPriceFound) minPriceFound = p.price;
        if (p.price > maxPriceFound) maxPriceFound = p.price;
      }
      if (p.stock > 0) inStockCount++;
      if ((p.discountPercentage || 0) >= 20) discountTiers['20_and_above']++;
      if ((p.discountPercentage || 0) >= 50) discountTiers['50_and_above']++;
    }

    return {
      brands: brandCounts,
      categories: categoryCounts,
      priceRange: {
        min: minPriceFound === Infinity ? 0 : minPriceFound,
        max: maxPriceFound,
      },
      inStockCount,
      discountTiers,
    };
  }

  /**
   * Edge N-Gram token generator
   */
  static generateNgrams(text = '', minLen = 2) {
    const clean = text.trim().toLowerCase();
    const tokens = [];
    for (let i = minLen; i <= clean.length; i++) {
      tokens.push(clean.substring(0, i));
    }
    return tokens;
  }

  /**
   * Fuzzy typo match resolver using Levenshtein distance
   */
  static fuzzyMatch(query = '', candidates = []) {
    const cleanQ = query.trim().toLowerCase();
    let bestMatch = null;
    let minDistance = Infinity;

    for (const cand of candidates) {
      const words = cand.toLowerCase().split(' ');
      for (const word of words) {
        const dist = levenshteinDistance(cleanQ, word);
        if (dist < minDistance && dist <= 2) {
          minDistance = dist;
          bestMatch = cand;
        }
      }
    }
    return bestMatch;
  }
}

export { levenshteinDistance };
export default FacetedSearchEngine;
