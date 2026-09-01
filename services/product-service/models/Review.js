import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Product ID is required for review'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'User ID is required for review'],
      index: true,
    },
    userName: {
      type: String,
      required: [true, 'Reviewer name is required'],
      trim: true,
      maxlength: 100,
    },
    userAvatar: {
      type: String,
      trim: true,
      default: '',
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      required: [true, 'Rating (1 to 5) is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    title: {
      type: String,
      required: [true, 'Review headline/title is required'],
      trim: true,
      maxlength: 120,
    },
    comment: {
      type: String,
      required: [true, 'Review body comment is required'],
      trim: true,
      maxlength: 3000,
    },
    photos: {
      type: [String],
      default: [],
      validate: {
        validator: function (val) {
          return !val || val.length <= 5;
        },
        message: 'A maximum of 5 photos can be attached per review',
      },
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    merchantReply: {
      comment: {
        type: String,
        trim: true,
        maxlength: 2000,
      },
      repliedAt: {
        type: Date,
      },
      companyId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      companyName: {
        type: String,
        trim: true,
      },
    },
    status: {
      type: String,
      enum: ['published', 'flagged', 'hidden'],
      default: 'published',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
