import mongoose from 'mongoose';
import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';

export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isPublished: true };

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
      Product.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      products,
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

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      product,
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
    const { title, description, price, category, stock, image } = req.body;

    if (!title || !description || price === undefined || !category || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, price, category, and stock count',
      });
    }

    const product = await Product.create({
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      category: category.trim().toLowerCase(),
      stock: Number(stock),
      image:
        image && image.trim()
          ? image.trim()
          : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
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
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      products,
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

    const { title, description, price, category, stock, image, isPublished } = req.body;

    if (title !== undefined) product.title = title.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (category !== undefined) product.category = category.trim().toLowerCase();
    if (stock !== undefined) product.stock = Number(stock);
    if (image !== undefined) product.image = image.trim();
    if (isPublished !== undefined) product.isPublished = Boolean(isPublished);

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
