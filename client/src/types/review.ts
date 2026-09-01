export interface ReviewMerchantReply {
  comment: string;
  repliedAt: string;
  companyId?: string;
  companyName?: string;
}

export interface ReviewProductMetadata {
  _id: string;
  title: string;
  image?: string;
  category?: string;
  price?: number;
}

export interface Review {
  _id: string;
  productId: string;
  product?: ReviewProductMetadata;
  userId: string;
  userName: string;
  userAvatar?: string;
  orderId?: string;
  isVerifiedPurchase: boolean;
  rating: number;
  title: string;
  comment: string;
  photos: string[];
  helpfulVotes: number;
  isHelpfulByMe?: boolean;
  merchantReply?: ReviewMerchantReply;
  status: 'published' | 'flagged' | 'hidden';
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  withPhotosCount: number;
  verifiedCount: number;
  distribution: ReviewDistribution;
  distributionPercentages: ReviewDistribution;
}

export interface CompanyReviewSummary {
  totalReviews: number;
  averageRating: number;
  unrepliedCount: number;
  repliedCount: number;
}

export interface ReviewPagination {
  page: number;
  limit: number;
  totalFiltered: number;
  totalPages: number;
}

export interface GetReviewsResponse {
  success: boolean;
  summary: ReviewSummary;
  pagination: ReviewPagination;
  reviews: Review[];
}

export interface GetCompanyReviewsResponse {
  success: boolean;
  summary: CompanyReviewSummary;
  pagination: ReviewPagination;
  reviews: Review[];
}

export interface CreateReviewInput {
  rating: number;
  title: string;
  comment: string;
  photos?: string[];
  orderId?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  comment?: string;
  photos?: string[];
}
