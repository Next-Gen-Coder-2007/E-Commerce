import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:5004';

// Helper to recalculate average rating and sync directly with Product Model
export const syncProductRatingStats = async (productId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) return null;

    const stats = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'published' } },
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          numReviews: { $sum: 1 },
        },
      },
    ]);

    const avgRating = stats.length > 0 ? Math.round(stats[0].averageRating * 10) / 10 : 0;
    const count = stats.length > 0 ? stats[0].numReviews : 0;

    // Atomically sync directly to Product model in same DB
    await Product.findByIdAndUpdate(productId, {
      rating: avgRating,
      numReviews: count,
    });

    return { rating: avgRating, numReviews: count };
  } catch (error) {
    console.error(`[Product/Review Service] Error computing rating stats: ${error.message}`);
    return null;
  }
};

// Helper to check if buyer purchased the product via Order Service
const checkVerifiedPurchase = async (userId, productId) => {
  try {
    if (!userId || !productId) return false;
    const response = await fetch(
      `${ORDER_SERVICE_URL}/api/orders/check-purchase/${userId}/${productId}`
    );
    if (response.ok) {
      const data = await response.json();
      return Boolean(data.hasPurchased);
    }
  } catch {
    // Non-blocking fallback
  }
  return false;
};

// GET /api/reviews/product/:productId (Public)
export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const currentUserId = req.user?.userId;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product identifier',
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {
      productId: new mongoose.Types.ObjectId(productId),
      status: 'published',
    };

    // Rating star filter
    if (req.query.rating) {
      const targetRating = parseInt(req.query.rating, 10);
      if (targetRating >= 1 && targetRating <= 5) {
        filter.rating = targetRating;
      }
    }

    // Filter reviews with photos
    if (req.query.withPhotos === 'true') {
      filter.photos = { $exists: true, $not: { $size: 0 } };
    }

    // Filter verified purchases only
    if (req.query.verifiedOnly === 'true') {
      filter.isVerifiedPurchase = true;
    }

    // Sort order
    let sortOption = { createdAt: -1 };
    if (req.query.sort === 'highest_rating') {
      sortOption = { rating: -1, createdAt: -1 };
    } else if (req.query.sort === 'lowest_rating') {
      sortOption = { rating: 1, createdAt: -1 };
    } else if (req.query.sort === 'most_helpful') {
      sortOption = { helpfulVotes: -1, createdAt: -1 };
    } else if (req.query.sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    // Run parallel aggregation for distribution stats + paginated query
    const [rawStats, starCounts, totalFiltered, reviewsList] = await Promise.all([
      // Overall stats (regardless of filter)
      Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'published' } },
        {
          $group: {
            _id: '$productId',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            withPhotosCount: {
              $sum: {
                $cond: [{ $gt: [{ $size: { $ifNull: ['$photos', []] } }, 0] }, 1, 0],
              },
            },
            verifiedCount: {
              $sum: {
                $cond: [{ $eq: ['$isVerifiedPurchase', true] }, 1, 0],
              },
            },
          },
        },
      ]),
      // 5-Star distribution
      Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'published' } },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
      ]),
      // Count matching current filter
      Review.countDocuments(filter),
      // Paginated reviews
      Review.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
    ]);

    const totalCount = rawStats.length > 0 ? rawStats[0].totalReviews : 0;
    const avgRating = rawStats.length > 0 ? Math.round(rawStats[0].averageRating * 10) / 10 : 0;
    const withPhotosCount = rawStats.length > 0 ? rawStats[0].withPhotosCount : 0;
    const verifiedCount = rawStats.length > 0 ? rawStats[0].verifiedCount : 0;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    starCounts.forEach((item) => {
      if (item._id && distribution[item._id] !== undefined) {
        distribution[item._id] = item.count;
      }
    });

    const distributionPercentages = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (totalCount > 0) {
      for (let s = 1; s <= 5; s++) {
        distributionPercentages[s] = Math.round((distribution[s] / totalCount) * 100);
      }
    }

    const formattedReviews = reviewsList.map((rev) => ({
      ...rev,
      isHelpfulByMe: currentUserId
        ? rev.helpfulUserIds?.some((id) => id.toString() === currentUserId.toString()) || false
        : false,
      helpfulUserIds: undefined,
    }));

    res.status(200).json({
      success: true,
      summary: {
        averageRating: avgRating,
        totalReviews: totalCount,
        withPhotosCount,
        verifiedCount,
        distribution,
        distributionPercentages,
      },
      pagination: {
        page,
        limit,
        totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
      },
      reviews: formattedReviews,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reviews/product/:productId/my-review (Authenticated)
export const getMyProductReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product identifier',
      });
    }

    const review = await Review.findOne({
      productId: new mongoose.Types.ObjectId(productId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    res.status(200).json({
      success: true,
      review: review || null,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reviews/my-reviews/product-ids (Authenticated Customers)
export const getMyReviewedProductIds = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const reviews = await Review.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).select('productId orderId rating createdAt');

    const productIds = reviews.map((r) => r.productId.toString());
    const orderProductKeys = reviews
      .filter((r) => r.orderId)
      .map((r) => `${r.orderId}_${r.productId}`);

    res.status(200).json({
      success: true,
      productIds,
      orderProductKeys,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/reviews/product/:productId (Authenticated Customers)
export const createReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { userId, email, role } = req.user;
    const name = req.user.name || req.user.companyName || email.split('@')[0];

    if (role === 'company') {
      return res.status(403).json({
        success: false,
        message: 'Merchant accounts cannot submit customer product reviews.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product identifier',
      });
    }

    const { rating, title, comment, photos = [], orderId } = req.body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5 stars.',
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a review title/headline.',
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a review comment.',
      });
    }

    // Check if user already reviewed this product
    const existing = await Review.findOne({
      productId: new mongoose.Types.ObjectId(productId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this product. You can edit your existing review.',
      });
    }

    // Check verified purchase
    let isVerified = false;
    let resolvedOrderId = null;

    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
      isVerified = true;
      resolvedOrderId = new mongoose.Types.ObjectId(orderId);
    } else {
      isVerified = await checkVerifiedPurchase(userId, productId);
    }

    const sanitizedPhotos = Array.isArray(photos)
      ? photos.filter((url) => typeof url === 'string' && url.trim().length > 0).slice(0, 5)
      : [];

    const review = await Review.create({
      productId: new mongoose.Types.ObjectId(productId),
      userId: new mongoose.Types.ObjectId(userId),
      userName: name || email.split('@')[0] || 'Customer',
      orderId: resolvedOrderId,
      isVerifiedPurchase: isVerified,
      rating: numRating,
      title: title.trim(),
      comment: comment.trim(),
      photos: sanitizedPhotos,
      status: 'published',
    });

    // Recompute product rating and sync
    await syncProductRatingStats(productId);

    res.status(201).json({
      success: true,
      message: 'Thank you! Your verified review has been published.',
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product.',
      });
    }
    next(error);
  }
};

// PUT /api/reviews/:id (Author or Admin)
export const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review identifier',
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (review.userId.toString() !== userId.toString() && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own customer reviews.',
      });
    }

    const { rating, title, comment, photos } = req.body;

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (numRating >= 1 && numRating <= 5) {
        review.rating = numRating;
      }
    }
    if (title && title.trim()) {
      review.title = title.trim();
    }
    if (comment && comment.trim()) {
      review.comment = comment.trim();
    }
    if (Array.isArray(photos)) {
      review.photos = photos.filter((u) => typeof u === 'string' && u.trim().length > 0).slice(0, 5);
    }

    await review.save();

    // Recompute product rating
    await syncProductRatingStats(review.productId);

    res.status(200).json({
      success: true,
      message: 'Your review has been updated successfully.',
      review,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/reviews/:id (Author, Company Owner, or Admin)
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review identifier',
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    const isAuthor = review.userId.toString() === userId.toString();
    const isAdmin = role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to remove this review.',
      });
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(id);

    // Recompute product rating
    await syncProductRatingStats(productId);

    res.status(200).json({
      success: true,
      message: 'Review removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/reviews/:id/helpful (Authenticated)
export const voteHelpful = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review identifier',
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const hasVoted = review.helpfulUserIds?.some((uId) => uId.toString() === userId.toString());

    if (hasVoted) {
      review.helpfulUserIds = review.helpfulUserIds.filter(
        (uId) => uId.toString() !== userId.toString()
      );
      review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
    } else {
      if (!review.helpfulUserIds) review.helpfulUserIds = [];
      review.helpfulUserIds.push(userObjectId);
      review.helpfulVotes = (review.helpfulVotes || 0) + 1;
    }

    await review.save();

    res.status(200).json({
      success: true,
      helpfulVotes: review.helpfulVotes,
      isHelpfulByMe: !hasVoted,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/reviews/:id/reply (Merchant Company Response)
export const replyToReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, companyName, role } = req.user;
    const { comment } = req.body;

    if (role !== 'company' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only registered merchants can publish official responses to customer reviews.',
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a response comment.',
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Verify company ownership of the product
    const product = await Product.findById(review.productId);
    if (product && product.companyId.toString() !== userId.toString() && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only respond to reviews on your own store products.',
      });
    }

    review.merchantReply = {
      comment: comment.trim(),
      repliedAt: new Date(),
      companyId: new mongoose.Types.ObjectId(userId),
      companyName: companyName || product?.companyName || 'Verified Merchant',
    };

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Official merchant response published successfully.',
      merchantReply: review.merchantReply,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/reviews/:id/reply (Merchant Company Response Deletion)
export const deleteMerchantReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    if (role !== 'company' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only registered merchants can delete responses.',
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    review.merchantReply = undefined;
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Merchant response removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reviews/company/mine (Merchant Central Reviews Feed)
export const getCompanyReviews = async (req, res, next) => {
  try {
    const { userId, role } = req.user;

    if (role !== 'company' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Merchant access required.',
      });
    }

    const companyProducts = await Product.find({ companyId: new mongoose.Types.ObjectId(userId) }).select('_id title image images category price numReviews rating');

    if (!companyProducts || companyProducts.length === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          totalReviews: 0,
          averageRating: 0,
          unrepliedCount: 0,
          repliedCount: 0,
        },
        pagination: { page: 1, limit: 10, totalFiltered: 0, totalPages: 1 },
        reviews: [],
      });
    }

    const productMap = new Map();
    companyProducts.forEach((p) => {
      productMap.set(p._id.toString(), {
        _id: p._id.toString(),
        title: p.title,
        image: p.images?.[0] || p.image,
        category: p.category,
        price: p.price,
      });
    });

    const productIds = Array.from(productMap.keys()).map((id) => new mongoose.Types.ObjectId(id));

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const filter = {
      productId: { $in: productIds },
      status: 'published',
    };

    if (req.query.productId && productMap.has(req.query.productId)) {
      filter.productId = new mongoose.Types.ObjectId(req.query.productId);
    }

    if (req.query.rating) {
      const targetRating = parseInt(req.query.rating, 10);
      if (targetRating >= 1 && targetRating <= 5) {
        filter.rating = targetRating;
      }
    }

    if (req.query.replyStatus === 'unreplied') {
      filter.merchantReply = { $exists: false };
    } else if (req.query.replyStatus === 'replied') {
      filter.merchantReply = { $exists: true, $ne: null };
    }

    const [stats, totalFiltered, reviewsList] = await Promise.all([
      Review.aggregate([
        { $match: { productId: { $in: productIds }, status: 'published' } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            repliedCount: {
              $sum: {
                $cond: [{ $ifNull: ['$merchantReply.comment', false] }, 1, 0],
              },
            },
          },
        },
      ]),
      Review.countDocuments(filter),
      Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;
    const avgRating = stats.length > 0 && totalReviews > 0 ? Math.round(stats[0].averageRating * 10) / 10 : 0;
    const repliedCount = stats.length > 0 ? stats[0].repliedCount : 0;
    const unrepliedCount = Math.max(0, totalReviews - repliedCount);

    const formattedReviews = reviewsList.map((rev) => ({
      ...rev,
      product: productMap.get(rev.productId.toString()) || undefined,
    }));

    res.status(200).json({
      success: true,
      summary: {
        totalReviews,
        averageRating: avgRating,
        unrepliedCount,
        repliedCount,
      },
      pagination: {
        page,
        limit,
        totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
      },
      reviews: formattedReviews,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/reviews/upload-photo (Customer Review Photo Upload via Cloudinary)
export const uploadReviewPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image file to upload',
      });
    }

    const base64String = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const uploadResponse = await cloudinary.uploader.upload(base64String, {
      folder: 'ecommerce-reviews',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    });

    res.status(200).json({
      success: true,
      url: uploadResponse.secure_url,
    });
  } catch (error) {
    console.error('[Review Photo Upload Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload review photo',
    });
  }
};
