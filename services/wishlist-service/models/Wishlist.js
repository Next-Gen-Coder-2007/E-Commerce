import mongoose from 'mongoose';

const wishlistItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    priceAtAdd: {
      type: Number,
      required: true,
      min: 0,
    },
    currentPrice: {
      type: Number,
      min: 0,
    },
    image: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'general',
      trim: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    companyName: {
      type: String,
      default: 'Direct Supplier',
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    items: [wishlistItemSchema],
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    totalItems: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

wishlistSchema.pre('save', function (next) {
  this.totalItems = this.items?.length || 0;
  next();
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;
