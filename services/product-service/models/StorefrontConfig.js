import mongoose from 'mongoose';

const storefrontConfigSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    bannerImage: {
      type: String,
      default: '',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Official Brand Storefront',
      trim: true,
      maxlength: [200, 'Tagline cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Store description cannot exceed 2000 characters'],
    },
    announcement: {
      type: String,
      default: '',
      trim: true,
      maxlength: [300, 'Announcement cannot exceed 300 characters'],
    },
    flashSale: {
      isActive: {
        type: Boolean,
        default: false,
      },
      title: {
        type: String,
        default: '⚡ Limited-Time Store Flash Sale',
        trim: true,
      },
      description: {
        type: String,
        default: 'Grab exclusive promotional prices on verified brand collections before time runs out!',
        trim: true,
      },
      discountPercentage: {
        type: Number,
        default: 20,
        min: 1,
        max: 95,
      },
      endsAt: {
        type: Date,
        default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days default
      },
    },
  },
  {
    timestamps: true,
  }
);

const StorefrontConfig = mongoose.model('StorefrontConfig', storefrontConfigSchema);

export default StorefrontConfig;
