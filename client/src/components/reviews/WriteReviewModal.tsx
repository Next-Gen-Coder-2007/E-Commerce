import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Star,
  Upload,
  Trash2,
  AlertCircle,
  Camera,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  createReviewApi,
  updateReviewApi,
  uploadReviewPhotoApi,
} from '../../services/reviewService';
import type { Review, CreateReviewInput } from '../../types/review';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  productImage?: string;
  orderId?: string;
  existingReview?: Review | null;
  onReviewSaved: (review: Review) => void;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Poor - Not as described',
  2: 'Fair - Needs improvement',
  3: 'Good - Average quality',
  4: 'Very Good - Highly recommend',
  5: 'Excellent - Outstanding experience!',
};

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isOpen,
  onClose,
  productId,
  productTitle,
  productImage,
  orderId,
  existingReview,
  onReviewSaved,
}) => {
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState<string>(existingReview?.title || '');
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [photos, setPhotos] = useState<string[]>(existingReview?.photos || []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setTitle(existingReview.title);
      setComment(existingReview.comment);
      setPhotos(existingReview.photos || []);
    } else {
      setRating(5);
      setTitle('');
      setComment('');
      setPhotos([]);
    }
    setError(null);
  }, [existingReview, isOpen]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 5) {
      setError('You can attach a maximum of 5 photos per review.');
      return;
    }

    setUploadingPhoto(true);
    setError(null);

    try {
      const newPhotoUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 5 * 1024 * 1024) {
          setError(`"${file.name}" exceeds 5MB size limit.`);
          continue;
        }
        const res = await uploadReviewPhotoApi(file);
        if (res.url) {
          newPhotoUrls.push(res.url);
        }
      }

      setPhotos((prev) => [...prev, ...newPhotoUrls].slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please add a headline for your review.');
      return;
    }
    if (!comment.trim()) {
      setError('Please write some details about your experience.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: CreateReviewInput = {
      rating,
      title: title.trim(),
      comment: comment.trim(),
      photos,
      orderId,
    };

    try {
      if (existingReview) {
        const res = await updateReviewApi(existingReview._id, payload);
        onReviewSaved(res.review);
      } else {
        const res = await createReviewApi(productId, payload);
        onReviewSaved(res.review);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const activeStarScore = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div>
            <h3 className="text-lg font-bold text-zinc-950">
              {existingReview ? 'Edit Your Review' : 'Write a Customer Review'}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-sm">
              {productTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Glance */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80">
            {productImage && (
              <img
                src={productImage}
                alt={productTitle}
                className="w-12 h-12 rounded-xl object-contain bg-white border border-zinc-200 shrink-0 p-1"
              />
            )}
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-zinc-900 truncate">
                {productTitle}
              </h4>
              <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Verified Buyer Review Program</span>
              </span>
            </div>
          </div>

          {/* Star Rating Picker */}
          <div className="space-y-2 text-center py-2">
            <label className="block text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
              Overall Rating
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <button
                  key={starValue}
                  type="button"
                  onMouseEnter={() => setHoverRating(starValue)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => setRating(starValue)}
                  className="p-1 text-zinc-300 hover:scale-115 active:scale-95 transition-all cursor-pointer"
                  title={`${starValue} Stars`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      starValue <= activeStarScore
                        ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                        : 'text-zinc-200 hover:text-zinc-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-xs font-bold text-indigo-600 h-4">
              {RATING_DESCRIPTIONS[activeStarScore]}
            </div>
          </div>

          {/* Review Headline */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-900">
              Review Headline <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="What's most important to know? (e.g. Outstanding sound quality & battery!)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-950 transition-all shadow-2xs"
            />
          </div>

          {/* Review Details Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-zinc-900">
                Detailed Feedback <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">
                {comment.length} / 3000
              </span>
            </div>
            <textarea
              required
              rows={4}
              maxLength={3000}
              placeholder="Share what you liked or disliked, specific features, material feel, build quality, and how it met your expectations..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-white text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-950 transition-all shadow-2xs resize-none"
            />
          </div>

          {/* Photos Manager */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <span>Attach Reference Photos ({photos.length}/5)</span>
              </label>
              <span className="text-[11px] text-zinc-400">Optional</span>
            </div>

            {/* Photo Thumbnail Grid */}
            <div className="grid grid-cols-5 gap-2.5">
              {photos.map((photoUrl, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden group shadow-2xs"
                >
                  <img
                    src={photoUrl}
                    alt={`Review attachment ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 p-1 rounded-md bg-zinc-950/80 hover:bg-rose-600 text-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {photos.length < 5 && (
                <label
                  className={`aspect-square rounded-xl border-2 border-dashed border-zinc-300 hover:border-zinc-950 bg-zinc-50 hover:bg-zinc-100/80 flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-all ${
                    uploadingPhoto ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {uploadingPhoto ? (
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-zinc-500 mb-1" />
                      <span className="text-[9px] font-bold text-zinc-600">
                        + Photo
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingPhoto}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{existingReview ? 'Update Review' : 'Submit Review'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
