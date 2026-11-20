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
import { BrutalistButton } from '../BrutalistButton';

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
  1: '01 / SUBPAR — Critical divergence from specifications',
  2: '02 / DEFICIENT — Requires structural improvements',
  3: '03 / SATISFACTORY — Meets standard operational requirements',
  4: '04 / SUPERIOR — Recommended acquisition',
  5: '05 / EXEMPLARY — Outstanding craftsmanship & performance',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1E1E]/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-[#E4E2DD] border-2 border-[#1E1E1E] shadow-[8px_8px_0px_#1E1E1E] w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b-2 border-[#1E1E1E] flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-clash font-bold text-[#1E1E1E] uppercase tracking-tight">
              {existingReview ? 'EDIT YOUR REVIEW' : 'WRITE A CUSTOMER REVIEW'}
            </h3>
            <p className="text-xs font-mono text-[#444444] mt-0.5 truncate max-w-sm uppercase">
              PRODUCT: {productTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 border border-[#1E1E1E] hover:bg-[#1E1E1E] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
          {error && (
            <div className="p-3 border-2 border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#1E1E1E] text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#DB4A2B] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Glance */}
          <div className="flex items-center gap-3 p-3 border-2 border-[#1E1E1E] bg-white">
            {productImage && (
              <img
                src={productImage}
                alt={productTitle}
                className="w-14 h-14 border border-[#1E1E1E] object-contain bg-[#E4E2DD] shrink-0 p-1"
              />
            )}
            <div className="min-w-0">
              <h4 className="text-xs font-clash font-bold text-[#1E1E1E] uppercase truncate">
                {productTitle}
              </h4>
              <span className="text-[10px] font-mono text-[#444444] flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#DB4A2B]" />
                <span>VERIFIED PURCHASER</span>
              </span>
            </div>
          </div>

          {/* Star Rating Picker */}
          <div className="space-y-2 text-center py-2 border-2 border-[#1E1E1E] bg-white p-4">
            <label className="block text-xs font-clash font-bold text-[#1E1E1E] uppercase tracking-wider">
              OVERALL RATING [1-5]
            </label>
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <button
                  key={starValue}
                  type="button"
                  onMouseEnter={() => setHoverRating(starValue)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => setRating(starValue)}
                  className="p-1 hover:scale-125 transition-all cursor-pointer"
                  title={`${starValue} Stars`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      starValue <= activeStarScore
                        ? 'fill-[#DB4A2B] text-[#DB4A2B]'
                        : 'text-zinc-300 hover:text-zinc-400'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-xs font-mono font-bold text-[#DB4A2B] h-4 uppercase">
              {RATING_DESCRIPTIONS[activeStarScore]}
            </div>
          </div>

          {/* Review Headline */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#1E1E1E]">
              REVIEW HEADLINE <span className="text-[#DB4A2B]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="Headline or summary of your experience..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-[#1E1E1E] bg-white text-xs font-satoshi text-[#1E1E1E] focus:outline-none"
            />
          </div>

          {/* Review Details Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#1E1E1E]">
                DETAILED FEEDBACK <span className="text-[#DB4A2B]">*</span>
              </label>
              <span className="text-[10px] text-[#444444] font-mono">
                {comment.length} / 3000
              </span>
            </div>
            <textarea
              required
              rows={4}
              maxLength={3000}
              placeholder="What did you like or dislike? How was the fit, material quality, and everyday usability?..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#1E1E1E] bg-white text-xs font-satoshi text-[#1E1E1E] focus:outline-none resize-none"
            />
          </div>

          {/* Photos Manager */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#1E1E1E] flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#DB4A2B]" />
                <span>CUSTOMER PHOTOS ({photos.length}/5)</span>
              </label>
              <span className="text-[10px] font-mono text-[#444444]">OPTIONAL</span>
            </div>

            {/* Photo Thumbnail Grid */}
            <div className="grid grid-cols-5 gap-2.5">
              {photos.map((photoUrl, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square border-2 border-[#1E1E1E] bg-white overflow-hidden group shadow-[2px_2px_0px_#1E1E1E]"
                >
                  <img
                    src={photoUrl}
                    alt={`Review attachment ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-[#DB4A2B] text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {photos.length < 5 && (
                <label
                  className={`aspect-square border-2 border-dashed border-[#1E1E1E] hover:bg-white bg-[#D9D6D0] flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-all ${
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
                    <div className="w-4 h-4 border-2 border-[#1E1E1E] border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-[#1E1E1E] mb-1" />
                      <span className="text-[9px] font-mono font-bold text-[#1E1E1E] uppercase">
                        + ATTACH
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t-2 border-[#1E1E1E] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border-2 border-[#1E1E1E] bg-white text-xs font-mono font-bold uppercase tracking-wider text-[#1E1E1E] hover:bg-[#D9D6D0] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <BrutalistButton
              type="submit"
              disabled={submitting || uploadingPhoto}
              loading={submitting}
              variant="primary"
            >
              <span>{existingReview ? 'Update Review' : 'Submit Review'}</span>
            </BrutalistButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteReviewModal;
