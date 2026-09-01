import express from 'express';
import multer from 'multer';
import {
  getProductReviews,
  getMyProductReview,
  getMyReviewedProductIds,
  createReview,
  updateReview,
  deleteReview,
  voteHelpful,
  replyToReview,
  deleteMerchantReply,
  getCompanyReviews,
  uploadReviewPhoto,
} from '../controllers/reviewController.js';
import { attachUser, requireAuth, requireCustomer, requireCompany } from '../middleware/authCheck.js';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for customer review photos
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, WEBP) are allowed for review attachments'), false);
    }
  },
});

const router = express.Router();

// Merchant Company routes
router.get('/company/mine', requireCompany, getCompanyReviews);

// Customer Reviewed Items IDs (for order list review status)
router.get('/my-reviews/product-ids', requireAuth, getMyReviewedProductIds);

// Public / User attached routes
router.get('/product/:productId', attachUser, getProductReviews);
router.get('/product/:productId/my-review', requireAuth, getMyProductReview);

// Customer Review mutations
router.post('/product/:productId', requireCustomer, createReview);
router.put('/:id', requireAuth, updateReview);
router.delete('/:id', requireAuth, deleteReview);

// Helpful voting
router.post('/:id/helpful', requireAuth, voteHelpful);

// Merchant response
router.post('/:id/reply', requireCompany, replyToReview);
router.delete('/:id/reply', requireCompany, deleteMerchantReply);

// Customer photo upload
router.post('/upload-photo', requireAuth, upload.single('photo'), uploadReviewPhoto);

export default router;
