import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [
        function () {
          return !this.googleId;
        },
        'Password is required for email/password registration',
      ],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['customer', 'company', 'admin'],
      default: 'customer',
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    savedAddresses: [
      {
        label: {
          type: String,
          default: 'Home',
          trim: true,
        },
        fullName: {
          type: String,
          required: true,
          trim: true,
        },
        phone: {
          type: String,
          required: [true, 'Contact phone number is required'],
          trim: true,
        },
        addressLine1: {
          type: String,
          required: true,
          trim: true,
        },
        addressLine2: {
          type: String,
          default: '',
          trim: true,
        },
        city: {
          type: String,
          required: true,
          trim: true,
        },
        state: {
          type: String,
          required: true,
          trim: true,
        },
        postalCode: {
          type: String,
          required: true,
          trim: true,
        },
        country: {
          type: String,
          default: 'United States',
          trim: true,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    businessDetails: {
      taxId: {
        type: String,
        default: '',
        trim: true,
      },
      supportEmail: {
        type: String,
        default: '',
        trim: true,
        lowercase: true,
      },
      supportPhone: {
        type: String,
        default: '',
        trim: true,
      },
      website: {
        type: String,
        default: '',
        trim: true,
      },
      storeDescription: {
        type: String,
        default: '',
        trim: true,
      },
      businessAddress: {
        addressLine1: { type: String, default: '', trim: true },
        addressLine2: { type: String, default: '', trim: true },
        city: { type: String, default: '', trim: true },
        state: { type: String, default: '', trim: true },
        postalCode: { type: String, default: '', trim: true },
        country: { type: String, default: 'United States', trim: true },
      },
      bankDetails: {
        accountHolderName: { type: String, default: '', trim: true },
        bankName: { type: String, default: '', trim: true },
        accountNumber: { type: String, default: '', trim: true },
        routingNumber: { type: String, default: '', trim: true },
        swiftCode: { type: String, default: '', trim: true },
        currency: { type: String, default: 'USD', trim: true },
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

export default User;
