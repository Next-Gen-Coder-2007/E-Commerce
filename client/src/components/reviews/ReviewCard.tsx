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
    <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-4 hover:border-zinc-300 transition-colors">
      {/* Product Reference Glance (if available from business reviews feed) */}
      {review.product && (
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {review.product.image && (
              <img
                src={review.product.image}
                alt={review.product.title}
                className="w-9 h-9 rounded-lg object-contain bg-zinc-50 border border-zinc-200 shrink-0 p-0.5"
              />
            )}
            <div className="min-w-0">
              <span className="text-xs font-bold text-zinc-950 truncate block">
                {review.product.title}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono capitalize">
                {review.product.category}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md shrink-0">
            PID: {review.productId.slice(-6)}
          </span>
        </div>
      )}

      {/* Review Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-xs uppercase">
            {review.userName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-950">
                {review.userName}
              </span>
              {review.isVerifiedPurchase && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Verified Purchase</span>
                </span>
              )}
            </div>
            <span className="text-[11px] text-zinc-400">
              Reviewed on {formattedDate}
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
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                title="Edit review"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-zinc-200'
                }`}
              />
            ))}
          </div>
          <h4 className="text-xs font-bold text-zinc-950 truncate">
            {review.title}
          </h4>
        </div>
      </div>

      {/* Review Comment Body */}
      <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line">
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
                className="relative w-16 h-16 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 hover:border-zinc-950 transition-all cursor-pointer shadow-2xs group"
              >
                <img
                  src={photoUrl}
                  alt={`Review Photo ${pIdx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal for Photo expansion */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2 border border-zinc-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-950/80 text-white hover:bg-zinc-950 transition-colors z-10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={selectedPhoto}
              alt="Customer Attachment View"
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Merchant Response Callout Box */}
      {review.merchantReply && (
        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-zinc-900">
              <Store className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                Response from {review.merchantReply.companyName || 'Verified Merchant'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {review.merchantReply.repliedAt && (
                <span className="text-zinc-400 text-[10px]">
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
                    className="p-1 text-zinc-400 hover:text-indigo-600 rounded-md hover:bg-zinc-200/60 transition-colors"
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
                    className="p-1 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                    title="Delete Merchant Response"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-line pl-5">
            {review.merchantReply.comment}
          </p>
        </div>
      )}

      {/* Merchant Reply Form (if merchant owner & wanting to respond / edit) */}
      {isMerchantOwner && (!review.merchantReply || showReplyForm) && (
        <div>
          {!showReplyForm && !review.merchantReply ? (
            <button
              type="button"
              onClick={() => {
                setReplyText('');
                setShowReplyForm(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 text-xs font-bold text-indigo-700 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Post Official Merchant Response</span>
            </button>
          ) : showReplyForm ? (
            <form onSubmit={handleSaveReply} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3">
              {replyError && (
                <div className="text-xs text-rose-600 font-medium">
                  {replyError}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                <Store className="w-3.5 h-3.5 text-indigo-600" />
                <span>{review.merchantReply ? 'Edit Official Merchant Response' : 'Write Official Merchant Response'}</span>
              </div>
              <textarea
                required
                rows={3}
                placeholder="Thank the customer for their review, answer any questions, or provide support..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-indigo-200 bg-white text-xs text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 resize-none shadow-2xs"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingReply ? 'Posting...' : 'Post Response'}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      )}

      {/* Footer: Helpful Upvote */}
      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span>Was this review helpful?</span>
          <button
            type="button"
            onClick={handleVoteHelpful}
            disabled={voting}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
              isHelpfulByMe
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <ThumbsUp className={`w-3 h-3 ${isHelpfulByMe ? 'fill-indigo-600 text-indigo-600' : ''}`} />
            <span>Helpful ({helpfulCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
