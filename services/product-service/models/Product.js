import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a product title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      default: 0,
      min: [0, 'Original price cannot be negative'],
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 99,
    },
    isFlashSale: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      trim: true,
      lowercase: true,
    },
    stock: {
      type: Number,
      required: [true, 'Please provide stock inventory count'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ title: 'text', description: 'text', category: 'text' });

const Product = mongoose.model('Product', productSchema);

export default Product;
