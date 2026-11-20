import React, { useState } from 'react';
import {
  Star,
  ShieldCheck,
  ThumbsUp,
  Store,
  Edit2,
  Trash2,
  X,
  MessageSquare,
} from 'lucide-react';
import {
  voteHelpfulApi,
  deleteReviewApi,
  replyToReviewApi,
  deleteMerchantReplyApi,
} from '../../services/reviewService';
import type { Review } from '../../types/review';
import { useAuth } from '../../context/AuthContext';

interface ReviewCardProps {
  review: Review;
  onEdit?: (review: Review) => void;
  onDeleted?: (reviewId: string) => void;
  onReviewUpdated?: (updated: Review) => void;
  isMerchantOwner?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onEdit,
  onDeleted,
  onReviewUpdated,
  isMerchantOwner = false,
}) => {
  const { user } = useAuth();
  const [helpfulCount, setHelpfulCount] = useState<number>(review.helpfulVotes || 0);
  const [isHelpfulByMe, setIsHelpfulByMe] = useState<boolean>(review.isHelpfulByMe || false);
  const [voting, setVoting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState(review.merchantReply?.comment || '');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const isAuthor = Boolean(user && user._id === review.userId);
  const isAdmin = user?.role === 'admin';

  const handleVoteHelpful = async () => {
    if (!user) {
      alert('Please sign in to vote on customer reviews.');
      return;
    }
    if (voting) return;
    setVoting(true);
    try {
      const res = await voteHelpfulApi(review._id);
      setHelpfulCount(res.helpfulVotes);
      setIsHelpfulByMe(res.isHelpfulByMe);
    } catch {
      // Non-blocking
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove this review?')) return;
    try {
      await deleteReviewApi(review._id);
      if (onDeleted) onDeleted(review._id);
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    }
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    setReplyError(null);
    try {
      const res = await replyToReviewApi(review._id, replyText.trim());
      setShowReplyForm(false);
      if (onReviewUpdated) {
        onReviewUpdated({
          ...review,
          merchantReply: res.merchantReply,
        });
      }
    } catch (err: any) {
      setReplyError(err.message || 'Failed to submit merchant response');
    } finally {
      setSubmittingReply(false);
    }
  };

  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="p-6 border-2 border-[#1E1E1E] bg-white shadow-[4px_4px_0px_#1E1E1E] space-y-4">
      {/* Product Reference Glance */}
      {review.product && (
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {review.product.image && (
              <img
                src={review.product.image}
                alt={review.product.title}
                className="w-10 h-10 border border-[#1E1E1E] object-contain bg-[#E4E2DD] shrink-0 p-1"
              />
            )}
            <div className="min-w-0">
              <span className="text-xs font-clash font-bold text-[#1E1E1E] truncate block">
                {review.product.title}
              </span>
              <span className="text-[10px] text-[#444444] font-mono uppercase">
                {review.product.category}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#1E1E1E] bg-[#D9D6D0] border border-[#1E1E1E] px-2 py-0.5 shrink-0">
            PID: {review.productId.slice(-6).toUpperCase()}
          </span>
        </div>
      )}

      {/* Review Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#1E1E1E] bg-[#1E1E1E] text-[#E4E2DD] font-clash font-bold flex items-center justify-center text-sm uppercase">
            {review.userName.charAt(0)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-clash font-bold text-[#1E1E1E] uppercase">
                {review.userName}
              </span>
              {review.isVerifiedPurchase && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#1E1E1E] bg-[#FF89A9]/20 border border-[#1E1E1E] px-2 py-0.5">
                  <ShieldCheck className="w-3 h-3 text-[#DB4A2B]" />
                  <span>VERIFIED BUYER</span>
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-[#444444] block mt-0.5">
              FILED: {formattedDate}
            </span>
          </div>
        </div>

        {/* Author Actions */}
        {(isAuthor || isAdmin) && (
          <div className="flex items-center gap-1.5">
            {isAuthor && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(review)}
                className="p-1.5 border border-[#1E1E1E] bg-white hover:bg-[#1E1E1E] hover:text-white transition-colors cursor-pointer"
                title="Edit review"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 border border-[#DB4A2B] bg-white text-[#DB4A2B] hover:bg-[#DB4A2B] hover:text-white transition-colors cursor-pointer"
              title="Delete review"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Stars & Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((starVal) => (
              <Star
                key={starVal}
                className={`w-3.5 h-3.5 ${
                  starVal <= review.rating
                    ? 'fill-[#DB4A2B] text-[#DB4A2B]'
                    : 'text-zinc-300'
                }`}
              />
            ))}
          </div>
          <h4 className="text-xs font-clash font-bold text-[#1E1E1E] uppercase truncate">
            {review.title}
          </h4>
        </div>
      </div>

      {/* Review Comment Body */}
      <p className="text-xs font-satoshi text-[#444444] leading-relaxed whitespace-pre-line">
        {review.comment}
      </p>

      {/* Customer Photos Gallery */}
      {review.photos && review.photos.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {review.photos.map((photoUrl, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => setSelectedPhoto(photoUrl)}
                className="relative w-16 h-16 border-2 border-[#1E1E1E] bg-[#E4E2DD] overflow-hidden shrink-0 hover:scale-105 transition-all cursor-pointer shadow-[2px_2px_0px_#1E1E1E] group"
              >
                <img
                  src={photoUrl}
                  alt={`Review Photo ${pIdx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1E1E]/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-[#E4E2DD] border-2 border-[#1E1E1E] shadow-[8px_8px_0px_#1E1E1E] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-[#1E1E1E] text-white hover:bg-[#DB4A2B] transition-colors z-10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={selectedPhoto}
              alt="Customer Attachment View"
              className="w-full max-h-[80vh] object-contain border border-[#1E1E1E] bg-white"
            />
          </div>
        </div>
      )}

      {/* Merchant Response Callout Box */}
      {review.merchantReply && (
        <div className="p-4 border-2 border-[#1E1E1E] bg-[#D9D6D0] space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5 font-bold text-[#1E1E1E]">
              <Store className="w-3.5 h-3.5 text-[#DB4A2B]" />
              <span className="uppercase">
                STATEMENT // {review.merchantReply.companyName || 'VERIFIED MERCHANT'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {review.merchantReply.repliedAt && (
                <span className="text-[#444444] text-[10px]">
                  {new Date(review.merchantReply.repliedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
              {isMerchantOwner && (
                <div className="flex items-center gap-1 ml-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyText(review.merchantReply?.comment || '');
                      setShowReplyForm(true);
                    }}
                    className="p-1 border border-[#1E1E1E] hover:bg-[#1E1E1E] hover:text-white transition-colors"
                    title="Edit Merchant Response"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm('Delete your merchant response?')) return;
                      try {
                        await deleteMerchantReplyApi(review._id);
                        if (onReviewUpdated) {
                          onReviewUpdated({
                            ...review,
                            merchantReply: undefined,
                          });
                        }
                      } catch (err: any) {
                        alert(err.message || 'Failed to remove response');
                      }
                    }}
                    className="p-1 border border-[#DB4A2B] text-[#DB4A2B] hover:bg-[#DB4A2B] hover:text-white transition-colors"
                    title="Delete Merchant Response"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs font-satoshi text-[#1E1E1E] leading-relaxed whitespace-pre-line pl-5 border-l-2 border-[#1E1E1E]">
            {review.merchantReply.comment}
          </p>
        </div>
      )}

      {/* Merchant Reply Form */}
      {isMerchantOwner && (!review.merchantReply || showReplyForm) && (
        <div className="pt-2">
          {!showReplyForm && !review.merchantReply ? (
            <button
              type="button"
              onClick={() => {
                setReplyText('');
                setShowReplyForm(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#1E1E1E] bg-[#D9D6D0] hover:bg-[#1E1E1E] hover:text-white text-xs font-mono font-bold uppercase tracking-wider text-[#1E1E1E] transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Broadcast Official Merchant Response</span>
            </button>
          ) : showReplyForm ? (
            <form onSubmit={handleSaveReply} className="p-4 border-2 border-[#1E1E1E] bg-[#D9D6D0] space-y-3">
              {replyError && (
                <div className="text-xs font-mono text-[#DB4A2B] font-bold">
                  {replyError}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs font-clash font-bold uppercase text-[#1E1E1E]">
                <Store className="w-3.5 h-3.5 text-[#DB4A2B]" />
                <span>{review.merchantReply ? 'Edit Merchant Response' : 'Draft Official Merchant Response'}</span>
              </div>
              <textarea
                required
                rows={3}
                placeholder="Submit official merchant statement or support resolution..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#1E1E1E] bg-white text-xs font-satoshi text-[#1E1E1E] focus:outline-none resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="px-3 py-1.5 border border-[#1E1E1E] text-xs font-mono font-bold text-[#444444] hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="px-4 py-1.5 border-2 border-[#1E1E1E] bg-[#1E1E1E] text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#DB4A2B] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingReply ? 'Posting...' : 'Post Statement'}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      )}

      {/* Footer: Helpful Upvote */}
      <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-xs font-mono text-[#444444]">
        <div className="flex items-center gap-2">
          <span>WAS THIS REVIEW HELPFUL?</span>
          <button
            type="button"
            onClick={handleVoteHelpful}
            disabled={voting}
            className={`inline-flex items-center gap-1.5 px-3 py-1 border-2 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              isHelpfulByMe
                ? 'bg-[#1E1E1E] border-[#1E1E1E] text-white'
                : 'bg-white border-[#1E1E1E] text-[#1E1E1E] hover:bg-[#D9D6D0]'
            }`}
          >
            <ThumbsUp className={`w-3 h-3 ${isHelpfulByMe ? 'fill-white text-white' : ''}`} />
            <span>HELPFUL ({helpfulCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
