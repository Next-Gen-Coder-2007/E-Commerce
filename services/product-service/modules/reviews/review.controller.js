import * as baseReviewController from '../../controllers/reviewController.js';
import { sendSuccess, sendError } from '../../utils/responseEnvelope.js';

export const {
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
} = baseReviewController;

export default {
  ...baseReviewController,
  sendSuccess,
  sendError,
};
