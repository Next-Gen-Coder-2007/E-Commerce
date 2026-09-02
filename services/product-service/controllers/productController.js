import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import StorefrontConfig from '../models/StorefrontConfig.js';
import cloudinary from '../config/cloudinary.js';

// Helper to calculate rating and review counts dynamically from the Review collection
export const attachCalculatedRatings = async (products) => {
  if (!products) return products;
  const isArray = Array.isArray(products);
  const prodList = isArray ? products : [products];
  if (prodList.length === 0) return products;

  const prodIds = prodList
    .map((p) => (p._id ? new mongoose.Types.ObjectId(p._id) : null))
    .filter(Boolean);

  if (prodIds.length === 0) return products;

  const reviewStats = await Review.aggregate([
    { $match: { productId: { $in: prodIds }, status: 'published' } },
    {
      $group: {
        _id: '$productId',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  const statsMap = new Map();
  reviewStats.forEach((st) => {
    statsMap.set(st._id.toString(), {
      rating: Math.round(st.avgRating * 10) / 10,
      numReviews: st.numReviews,
    });
  });

  const enriched = prodList.map((p) => {
    const doc = p.toObject ? p.toObject() : { ...p };
    const stat = statsMap.get(doc._id.toString());
    return {
      ...doc,
      rating: stat ? stat.rating : 0,
      numReviews: stat ? stat.numReviews : 0,
    };
  });

  return isArray ? enriched : enriched[0];
};

export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      companyId,
      companyName,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isPublished: true };

    if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
      query.companyId = companyId;
    }

    if (companyName && companyName.trim()) {
      query.companyName = { $regex: new RegExp(`^${companyName.trim()}$`, 'i') };
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { category: { $regex: term, $options: 'i' } },
        { companyName: { $regex: term, $options: 'i' } },
      ];
    }

    if (category && category.trim() && category.toLowerCase() !== 'all') {
      query.category = category.trim().toLowerCase();
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        query.price.$lte = Number(maxPrice);
      }
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { price: -1 };
    } else if (sort === 'rating') {
      sortOption = { rating: -1, numReviews: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
    ]);

    const enrichedProducts = await attachCalculatedRatings(products);

    res.status(200).json({
      success: true,
      count: enrichedProducts.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      products: enrichedProducts,
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyStorefront = async (req, res, next) => {
  try {
    const { companyIdentifier } = req.params;
    const {
      search,
      category,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    if (!companyIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Company identifier is required',
      });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(companyIdentifier);
    const companyQuery = isObjectId
      ? { $or: [{ companyId: companyIdentifier }, { companyName: { $regex: new RegExp(`^${companyIdentifier}$`, 'i') } }] }
      : { companyName: { $regex: new RegExp(`^${companyIdentifier}$`, 'i') } };

    // Find any published product from this company to extract company metadata
    const sampleProduct = await Product.findOne({ ...companyQuery, isPublished: true });

    if (!sampleProduct) {
      return res.status(404).json({
        success: false,
        message: 'Company store not found or has no published products',
      });
    }

    const resolvedCompanyId = sampleProduct.companyId;
    const resolvedCompanyName = sampleProduct.companyName;

    // Fetch custom storefront settings (or default if none exists)
    const storefrontConfig = await StorefrontConfig.findOne({ companyId: resolvedCompanyId });

    // Distinct categories for this company
    const categories = await Product.distinct('category', {
      companyId: resolvedCompanyId,
      isPublished: true,
    });

    // Calculate company rating and total reviews dynamically from the Review collection
    const companyProductIds = await Product.find({ companyId: resolvedCompanyId, isPublished: true }).distinct('_id');
    
    let totalReviews = 0;
    let avgRating = 0;

    if (companyProductIds.length > 0) {
      const companyReviewStats = await Review.aggregate([
        { $match: { productId: { $in: companyProductIds }, status: 'published' } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]);

      if (companyReviewStats.length > 0 && companyReviewStats[0].totalReviews > 0) {
        totalReviews = companyReviewStats[0].totalReviews;
        avgRating = Math.round(companyReviewStats[0].avgRating * 10) / 10;
      }
    }

    // Build filter query for products
    const productQuery = {
      companyId: resolvedCompanyId,
      isPublished: true,
    };

    if (search && search.trim()) {
      const term = search.trim();
      productQuery.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { category: { $regex: term, $options: 'i' } },
      ];
    }

    if (category && category.trim() && category.toLowerCase() !== 'all') {
      productQuery.category = category.trim().toLowerCase();
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      productQuery.price = {};
      if (minPrice !== undefined && minPrice !== '') {
        productQuery.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        productQuery.price.$lte = Number(maxPrice);
      }
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { price: -1 };
    } else if (sort === 'rating') {
      sortOption = { rating: -1, numReviews: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(productQuery).sort(sortOption).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(productQuery),
    ]);

    const enrichedProducts = await attachCalculatedRatings(products);

    res.status(200).json({
      success: true,
      store: {
        companyId: resolvedCompanyId,
        companyName: resolvedCompanyName,
        totalProducts: companyProductIds.length,
        rating: avgRating,
        numReviews: totalReviews,
        categories: categories.sort(),
        bannerImage: storefrontConfig?.bannerImage || '',
        tagline: storefrontConfig?.tagline || 'Official Brand Storefront',
        description: storefrontConfig?.description || '',
        announcement: storefrontConfig?.announcement || '',
        flashSale: storefrontConfig?.flashSale || {
          isActive: false,
          title: '⚡ Store Flash Sale',
          description: '',
          discountPercentage: 0,
          endsAt: null,
        },
      },
      count: enrichedProducts.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      products: enrichedProducts,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found with given identifier',
      });
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const enrichedProduct = await attachCalculatedRatings(product);

    res.status(200).json({
      success: true,
      product: enrichedProduct,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isPublished: true });
    res.status(200).json({
      success: true,
      categories: categories.sort(),
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      title,
      description,
      price,
      originalPrice,
      discountPercentage,
      isFlashSale,
      category,
      stock,
      image,
      images,
      specifications,
    } = req.body;

    if (!title || !description || price === undefined || !category || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, price, category, and stock count',
      });
    }

    const numericPrice = Number(price);
    let numericOriginal = originalPrice ? Number(originalPrice) : 0;
    let numericDiscount = discountPercentage ? Number(discountPercentage) : 0;

    if (numericOriginal > numericPrice && !numericDiscount) {
      numericDiscount = Math.round(((numericOriginal - numericPrice) / numericOriginal) * 100);
    } else if (numericDiscount > 0 && (!numericOriginal || numericOriginal <= numericPrice)) {
      numericOriginal = Number((numericPrice / (1 - numericDiscount / 100)).toFixed(2));
    }

    // Process images array (up to 10 photos)
    let processedImages = [];
    if (Array.isArray(images)) {
      processedImages = images
        .filter((img) => typeof img === 'string' && img.trim().length > 0)
        .slice(0, 10)
        .map((img) => img.trim());
    } else if (image && typeof image === 'string' && image.trim().length > 0) {
      processedImages = [image.trim()];
    }

    const primaryImage =
      processedImages.length > 0
        ? processedImages[0]
        : (image && image.trim()) ||
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';

    if (processedImages.length === 0) {
      processedImages = [primaryImage];
    }

    // Process specifications key-value pairs
    let processedSpecs = [];
    if (Array.isArray(specifications)) {
      processedSpecs = specifications
        .filter(
          (spec) =>
            spec &&
            typeof spec.key === 'string' &&
            spec.key.trim().length > 0
        )
        .map((spec) => ({
          key: spec.key.trim(),
          value:
            typeof spec.value === 'string'
              ? spec.value.trim()
              : String(spec.value || '').trim(),
        }));
    }

    const product = await Product.create({
      title: title.trim(),
      description: description.trim(),
      price: numericPrice,
      originalPrice: numericOriginal,
      discountPercentage: numericDiscount,
      isFlashSale: Boolean(isFlashSale),
      category: category.trim().toLowerCase(),
      stock: Number(stock),
      image: primaryImage,
      images: processedImages,
      specifications: processedSpecs,
      companyId: req.user.userId,
      companyName: req.user.companyName || 'Verified Merchant',
      isPublished: true,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyCompanyProducts = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;

    const query = { companyId: req.user.userId };

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (category && category.trim() && category.toLowerCase() !== 'all') {
      query.category = category.trim().toLowerCase();
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
    ]);

    const enrichedProducts = await attachCalculatedRatings(products);

    res.status(200).json({
      success: true,
      count: enrichedProducts.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      products: enrichedProducts,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    let product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (
      product.companyId.toString() !== req.user.userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to update this product listing.',
      });
    }

    const {
      title,
      description,
      price,
      originalPrice,
      discountPercentage,
      isFlashSale,
      category,
      stock,
      image,
      images,
      specifications,
      isPublished,
    } = req.body;

    if (title !== undefined) product.title = title.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
    if (discountPercentage !== undefined) product.discountPercentage = Number(discountPercentage);
    if (isFlashSale !== undefined) product.isFlashSale = Boolean(isFlashSale);
    if (category !== undefined) product.category = category.trim().toLowerCase();
    if (stock !== undefined) product.stock = Number(stock);
    if (isPublished !== undefined) product.isPublished = Boolean(isPublished);

    if (images !== undefined && Array.isArray(images)) {
      const cleanImages = images
        .filter((img) => typeof img === 'string' && img.trim().length > 0)
        .slice(0, 10)
        .map((img) => img.trim());
      product.images = cleanImages;
      if (cleanImages.length > 0) {
        product.image = cleanImages[0];
      }
      product.markModified('images');
    } else if (image !== undefined && image.trim()) {
      product.image = image.trim();
      if (!product.images || product.images.length === 0) {
        product.images = [product.image];
      } else {
        product.images[0] = product.image;
      }
      product.markModified('images');
    }

    if (specifications !== undefined && Array.isArray(specifications)) {
      product.specifications = specifications
        .filter(
          (spec) =>
            spec &&
            typeof spec.key === 'string' &&
            spec.key.trim().length > 0
        )
        .map((spec) => ({
          key: spec.key.trim(),
          value:
            typeof spec.value === 'string'
              ? spec.value.trim()
              : String(spec.value || '').trim(),
        }));
      product.markModified('specifications');
    }

    if (product.originalPrice > product.price && !product.discountPercentage) {
      product.discountPercentage = Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      );
    } else if (product.discountPercentage > 0 && (!product.originalPrice || product.originalPrice <= product.price)) {
      product.originalPrice = Number((product.price / (1 - product.discountPercentage / 100)).toFixed(2));
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const syncProductRating = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, numReviews } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (rating !== undefined) {
      product.rating = Math.max(0, Math.min(5, Number(rating) || 0));
    }
    if (numReviews !== undefined) {
      product.numReviews = Math.max(0, Number(numReviews) || 0);
    }

    await product.save();

    res.status(200).json({
      success: true,
      rating: product.rating,
      numReviews: product.numReviews,
    });
  } catch (error) {
    next(error);
  }
};

export const getStorefrontSettings = async (req, res, next) => {
  try {
    const companyId = req.user.userId;
    let config = await StorefrontConfig.findOne({ companyId });

    if (!config) {
      config = await StorefrontConfig.create({
        companyId,
        companyName: req.user.companyName || req.user.name || 'Merchant Store',
        tagline: 'Official Brand Storefront',
        description: '',
        announcement: '',
        flashSale: {
          isActive: false,
          title: '⚡ Limited-Time Flash Sale',
          description: 'Promotional discount on selected products',
          discountPercentage: 20,
          endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      });
    }

    res.status(200).json({
      success: true,
      storefront: config,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStorefrontSettings = async (req, res, next) => {
  try {
    const companyId = req.user.userId;
    const { bannerImage, tagline, description, announcement, flashSale } = req.body;

    let config = await StorefrontConfig.findOne({ companyId });

    if (!config) {
      config = new StorefrontConfig({
        companyId,
        companyName: req.user.companyName || req.user.name || 'Merchant Store',
      });
    }

    if (bannerImage !== undefined) config.bannerImage = bannerImage.trim();
    if (tagline !== undefined) config.tagline = tagline.trim();
    if (description !== undefined) config.description = description.trim();
    if (announcement !== undefined) config.announcement = announcement.trim();
    if (flashSale !== undefined) {
      config.flashSale = {
        isActive: Boolean(flashSale.isActive),
        title: flashSale.title || config.flashSale?.title || '⚡ Limited-Time Flash Sale',
        description: flashSale.description || '',
        discountPercentage: Number(flashSale.discountPercentage) || 0,
        endsAt: flashSale.endsAt ? new Date(flashSale.endsAt) : config.flashSale?.endsAt,
      };
    }

    await config.save();

    res.status(200).json({
      success: true,
      message: 'Storefront customized successfully',
      storefront: config,
    });
  } catch (error) {
    next(error);
  }
};

export const applyBulkDiscount = async (req, res, next) => {
  try {
    const companyId = req.user.userId;
    const { discountPercentage, category, isFlashSale, reset } = req.body;

    const query = { companyId };
    if (category && category !== 'all') {
      query.category = category.trim().toLowerCase();
    }

    if (reset) {
      const productsToReset = await Product.find(query);
      let updatedCount = 0;

      for (const prod of productsToReset) {
        if (prod.originalPrice && prod.originalPrice > prod.price) {
          prod.price = prod.originalPrice;
        }
        prod.originalPrice = 0;
        prod.discountPercentage = 0;
        prod.isFlashSale = false;
        await prod.save();
        updatedCount++;
      }

      return res.status(200).json({
        success: true,
        message: `Discounts reset for ${updatedCount} products`,
        updatedCount,
      });
    }

    const discountNum = Number(discountPercentage);
    if (isNaN(discountNum) || discountNum <= 0 || discountNum >= 100) {
      return res.status(400).json({
        success: false,
        message: 'Discount percentage must be between 1 and 99',
      });
    }

    const productsToUpdate = await Product.find(query);
    let updatedCount = 0;

    for (const prod of productsToUpdate) {
      const basePrice = prod.originalPrice && prod.originalPrice > prod.price ? prod.originalPrice : prod.price;
      prod.originalPrice = basePrice;
      prod.price = Number((basePrice * (1 - discountNum / 100)).toFixed(2));
      prod.discountPercentage = discountNum;
      if (isFlashSale !== undefined) {
        prod.isFlashSale = Boolean(isFlashSale);
      }
      await prod.save();
      updatedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Applied ${discountNum}% discount to ${updatedCount} products`,
      updatedCount,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (
      product.companyId.toString() !== req.user.userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to delete this product listing.',
      });
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyStats = async (req, res, next) => {
  try {
    const companyId = new mongoose.Types.ObjectId(req.user.userId);

    const [totalProducts, lowStock, outOfStock, inventoryAggregate] =
      await Promise.all([
        Product.countDocuments({ companyId }),
        Product.countDocuments({ companyId, stock: { $gt: 0, $lte: 5 } }),
        Product.countDocuments({ companyId, stock: 0 }),
        Product.aggregate([
          { $match: { companyId } },
          {
            $group: {
              _id: null,
              totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
              totalUnits: { $sum: '$stock' },
            },
          },
        ]),
      ]);

    const totalValue = inventoryAggregate[0]?.totalValue || 0;
    const totalUnits = inventoryAggregate[0]?.totalUnits || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalUnits,
        lowStock,
        outOfStock,
        totalValue: Number(totalValue.toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadImage = async (req, res) => {
  try {
    let fileBuffer;
    let mimeType = 'image/jpeg';

    if (req.file) {
      fileBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
    } else if (req.body.image && typeof req.body.image === 'string') {
      const base64Data = req.body.image;
      const match = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        fileBuffer = Buffer.from(match[2], 'base64');
      } else {
        fileBuffer = Buffer.from(base64Data, 'base64');
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'No image file or base64 payload provided for upload',
      });
    }

    const MAX_IMAGE_SIZE = 500 * 1024; // 500 KB
    if (fileBuffer.length > MAX_IMAGE_SIZE) {
      return res.status(400).json({
        success: false,
        message: 'Image size exceeds 500KB limit',
      });
    }

    const preset = process.env.CLOUDINARY_UPLOAD_PRESET;
    const uploadOptions = preset
      ? { upload_preset: preset, folder: 'novacommerce/products' }
      : { folder: 'novacommerce/products', resource_type: 'image' };

    try {
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = preset
          ? cloudinary.uploader.unsigned_upload_stream(preset, uploadOptions, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            })
          : cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            });
        uploadStream.end(fileBuffer);
      });

      const result = await uploadPromise;

      return res.status(200).json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (cloudErr) {
      const base64Fallback = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      return res.status(200).json({
        success: true,
        url: base64Fallback,
        isFallback: true,
        message: 'Image uploaded successfully in optimized local mode',
      });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Image processing failed',
    });
  }
};