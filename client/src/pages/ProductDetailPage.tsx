import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  ShieldCheck,
  RotateCcw,
  Share2,
  Check,
  ChevronRight,
  ArrowLeft,
  Heart,
  Plus,
  Minus,
  Info,
  PenSquare,
  Truck,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { ReviewCard } from '../components/reviews/ReviewCard';
import { FrequentlyBoughtTogether } from '../components/recommendations/FrequentlyBoughtTogether';
import { ProductCard } from '../components/ProductCard';
import { RawAtmosphere } from '../components/RawAtmosphere';
import { getProductByIdApi, getProductsApi } from '../services/productService';
import { getProductReviewsApi, getMyProductReviewApi } from '../services/reviewService';
import { WriteReviewModal } from '../components/reviews/WriteReviewModal';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import type { Product } from '../types/product';
import type { Review, ReviewSummary } from '../types/review';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, openBusinessModal } = useCart();
  const { user } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedRecently, setAddedRecently] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dynamic category variant selections
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Editorial collapsible accordions
  const [accordions, setAccordions] = useState<Record<string, boolean>>({
    details: true,
    specs: true,
    shipping: false,
    reviews: true,
  });

  const toggleAccordion = (key: string) => {
    setAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Customer Reviews State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [isWriteReviewModalOpen, setIsWriteReviewModalOpen] = useState(false);
  const [reviewSort, setReviewSort] = useState<'newest' | 'highest_rating' | 'lowest_rating' | 'most_helpful'>('newest');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | null>(null);
  const [reviewWithPhotosFilter, setReviewWithPhotosFilter] = useState<boolean>(false);
  const [reviewVerifiedOnlyFilter, setReviewVerifiedOnlyFilter] = useState<boolean>(false);

  const fetchProductData = useCallback(async (productId: string, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getProductByIdApi(productId);
      if (data.product) {
        setProduct(data.product);
        setQuantity((prev) => Math.max(1, Math.min(prev, data.product.stock || 1)));

        // Only initialize variants that the merchant actually specified
        const initialVars: Record<string, string> = {};
        if (data.product.attributes && typeof data.product.attributes === 'object') {
          Object.entries(data.product.attributes).forEach(([attrKey, attrVal]) => {
            const raw = String(attrVal || '').trim();
            if (raw) {
              const options = raw.split(',').map((s) => s.trim()).filter(Boolean);
              if (options.length > 0) {
                initialVars[attrKey] = options[0];
              }
            }
          });
        }

        setSelectedVariants(initialVars);

        // Fetch related products in the same category (limit to 3 for editorial grid)
        try {
          const relData = await getProductsApi({
            category: data.product.category,
            limit: 4,
          });
          setRelatedProducts(
            (relData.products || []).filter((p) => p._id !== data.product._id).slice(0, 3)
          );
        } catch {
          // Non-critical
        }
      } else {
        setError('PRODUCT NOT IDENTIFIED IN THE COMMERCE ARCHIVE.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'FAILED TO LOAD PRODUCT MANIFEST.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchReviews = useCallback(async (productId: string) => {
    setReviewsLoading(true);
    try {
      const res = await getProductReviewsApi(productId, {
        sort: reviewSort,
        rating: reviewRatingFilter || undefined,
        withPhotos: reviewWithPhotosFilter || undefined,
        verifiedOnly: reviewVerifiedOnlyFilter || undefined,
      });
      if (res.success) {
        setReviews(res.reviews || []);
        setReviewSummary(res.summary || null);
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setReviewsLoading(false);
    }
  }, [reviewSort, reviewRatingFilter, reviewWithPhotosFilter, reviewVerifiedOnlyFilter]);

  const fetchMyReview = useCallback(async (productId: string) => {
    if (!user || user.role === 'company') {
      setMyReview(null);
      return;
    }
    try {
      const res = await getMyProductReviewApi(productId);
      if (res.success) {
        setMyReview(res.review || null);
      }
    } catch {
      // Non-blocking
    }
  }, [user]);

  useEffect(() => {
    if (id) {
      fetchProductData(id);
      fetchMyReview(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [id, fetchProductData, fetchMyReview]);

  useEffect(() => {
    if (id) {
      fetchReviews(id);
    }
  }, [id, fetchReviews]);

  useEffect(() => {
    if (!id) return;
    const handleProductSync = (e: any) => {
      if (!e.detail?.productId || e.detail.productId === id) {
        fetchProductData(id, true);
        fetchReviews(id);
      }
    };
    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        fetchProductData(id, true);
        fetchReviews(id);
      }
    };

    window.addEventListener('product-updated', handleProductSync);
    window.addEventListener('visibilitychange', handleVisibilitySync);
    return () => {
      window.removeEventListener('product-updated', handleProductSync);
      window.removeEventListener('visibilitychange', handleVisibilitySync);
    };
  }, [id, fetchProductData, fetchReviews]);

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0) return;
    if (user?.role === 'company') {
      openBusinessModal({ actionTitle: 'Add to Cart', productTitle: product.title });
      return;
    }
    setAddingToCart(true);
    try {
      const variantSummary = Object.entries(selectedVariants)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' • ');

      const success = await addToCart(
        {
          productId: product._id,
          title: product.title,
          price: product.price,
          image: product.images?.[0] || product.image,
          category: product.category,
          companyId: product.companyId,
          companyName: product.companyName,
          stock: product.stock,
          quantity,
          variantSummary: variantSummary || undefined,
          selectedVariants: Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined,
        },
        true
      );
      if (success) {
        setAddedRecently(true);
        setTimeout(() => setAddedRecently(false), 2500);
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/checkout');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16 font-mono text-xs">
        <div className="animate-pulse space-y-8">
          <div className="h-4 bg-[#D9D6D0] w-1/4" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 aspect-[3/4] bg-[#D9D6D0]" />
            <div className="lg:col-span-5 space-y-4">
              <div className="h-4 bg-[#D9D6D0] w-1/4" />
              <div className="h-12 bg-[#D9D6D0] w-3/4" />
              <div className="h-6 bg-[#D9D6D0] w-1/3" />
              <div className="h-32 bg-[#D9D6D0] w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto px-4 py-28 text-center space-y-6 font-satoshi">
        <h2 className="font-clash text-2xl font-bold uppercase tracking-tight text-[#1E1E1E]">
          ITEM ARCHIVED / UNAVAILABLE
        </h2>
        <p className="text-xs text-[#444444] leading-relaxed">
          {error || 'This silhouette has been delisted or is temporarily depleted.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E1E1E] text-[#E4E2DD] text-xs font-bold uppercase tracking-widest hover:bg-[#DB4A2B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO ARCHIVE</span>
        </Link>
      </div>
    );
  }

  const hasRealDiscount = Boolean(
    (product.originalPrice && product.originalPrice > product.price) ||
    (product.discountPercentage && product.discountPercentage > 0)
  );
  const listPrice =
    product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice.toFixed(2)
      : null;
  const discountPercent =
    product.discountPercentage ||
    (product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0);

  const reviewCount = reviewSummary?.totalReviews || product.numReviews || 0;
  const rating = reviewSummary?.averageRating || product.rating || 0;

  const productPhotos =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];
  const activePhoto =
    productPhotos[selectedImageIndex] || productPhotos[0] || product.image;

  const inWish = isInWishlist(product._id);

  return (
    <div className="min-h-screen bg-[#E4E2DD] text-[#1E1E1E] font-satoshi pb-24 relative select-none">
      <RawAtmosphere variant="subtle" />

      {/* Top Breadcrumb & Share Strip */}
      <div className="border-b border-[#1E1E1E]/20 bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3.5 flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#444444]">
          <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
            <Link to="/" className="hover:text-[#DB4A2B] transition-colors">
              ARCHIVE
            </Link>
            <span>/</span>
            <Link
              to={`/?category=${encodeURIComponent(product.category)}`}
              className="hover:text-[#DB4A2B] transition-colors font-bold text-[#1E1E1E]"
            >
              {product.category}
            </Link>
            {product.subcategory && (
              <>
                <span>/</span>
                <Link
                  to={`/?category=${encodeURIComponent(product.category)}&subcategory=${encodeURIComponent(product.subcategory)}`}
                  className="hover:text-[#DB4A2B] transition-colors"
                >
                  {product.subcategory}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-[#1E1E1E] truncate max-w-[200px] font-bold">
              {product.title}
            </span>
          </nav>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E4E2DD] border border-[#1E1E1E]/30 hover:border-[#1E1E1E] text-[#1E1E1E] text-xs font-bold uppercase transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">LINK COPIED</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>SHARE MANIFEST</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Asymmetric Product Showcase Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-10 sm:pt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* LEFT COLUMN: Gallery with Vertical Thumbnails & 3:4 Aspect Image (7 cols) */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4 sm:gap-6 items-start">
            
            {/* Thumbnails */}
            {productPhotos.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[580px] no-scrollbar shrink-0 w-full sm:w-20">
                {productPhotos.map((photoUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-20 sm:w-20 sm:h-24 bg-[#FFFFFF] border p-1 transition-all cursor-pointer shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-2 border-[#1E1E1E] shadow-sm'
                        : 'border-[#1E1E1E]/20 hover:border-[#1E1E1E]/60 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={photoUrl}
                      alt={`${product.title} thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Showcase (3:4 ratio) */}
            <div className="relative flex-1 w-full aspect-[3/4] bg-[#FFFFFF] border-2 border-[#1E1E1E] p-8 sm:p-12 flex items-center justify-center overflow-hidden group">
              {/* Product Badge */}
              <span className="absolute top-4 left-4 px-3 py-1 bg-[#1E1E1E] text-[#E4E2DD] text-[10px] font-mono font-bold uppercase tracking-widest">
                {product.isFlashSale ? 'SPECIAL MARKDOWN' : 'VERIFIED EDITION'}
              </span>

              {/* Main Product Image */}
              <img
                src={activePhoto}
                alt={product.title}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] select-none"
              />

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`absolute top-4 right-4 w-10 h-10 border-2 flex items-center justify-center transition-all cursor-pointer ${
                  inWish
                    ? 'bg-[#1E1E1E] border-[#1E1E1E] text-[#FF89A9]'
                    : 'bg-[#FFFFFF] border-[#1E1E1E] text-[#1E1E1E] hover:text-[#DB4A2B]'
                }`}
                title={inWish ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart className={`w-4 h-4 ${inWish ? 'fill-[#FF89A9]' : ''}`} />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Asymmetric Editorial Metadata, Options & Brutalist Buy Flow (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-start space-y-6">
            <div>
              {/* Brand / Merchant Identifier */}
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#DB4A2B] mb-2">
                ORIGIN // {product.brand || product.companyName || 'VERIFIED DESIGN STUDIO'}
              </div>

              {/* Oversized Clash Display Title */}
              <h1 className="font-clash text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-[-0.04em] text-[#1E1E1E] leading-[0.95] mb-3">
                {product.title}
              </h1>

              {/* Rating & Review Metric */}
              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1 text-[#F8A348]">
                  <Star className="w-3.5 h-3.5 fill-[#F8A348]" />
                  <span className="font-bold text-[#1E1E1E]">{rating.toFixed(1)}</span>
                </div>
                <span className="text-[#444444]">/</span>
                <button
                  type="button"
                  onClick={() => {
                    setAccordions((prev) => ({ ...prev, reviews: true }));
                    const revEl = document.getElementById('reviews-section');
                    if (revEl) revEl.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-[#444444] hover:text-[#1E1E1E] uppercase tracking-wider underline cursor-pointer"
                >
                  {reviewCount} REVIEWS
                </button>
                <span className="text-[#444444]">/</span>
                <span className="text-[#1E1E1E] font-bold uppercase">
                  {product.stock > 0 ? `IN STOCK (${product.stock})` : 'DEPLETED'}
                </span>
              </div>
            </div>

            {/* Price Line */}
            <div className="flex items-baseline gap-3 p-4 bg-[#FFFFFF] border-2 border-[#1E1E1E]">
              <span className="text-2xl sm:text-3xl font-clash font-bold text-[#1E1E1E]">
                ${product.price.toFixed(2)}
              </span>
              {hasRealDiscount && listPrice && (
                <span className="text-sm font-mono text-[#444444] line-through">
                  ${listPrice}
                </span>
              )}
              {hasRealDiscount && discountPercent > 0 && (
                <span className="px-2 py-0.5 bg-[#DB4A2B] text-[#FFFFFF] font-mono text-[10px] font-bold uppercase">
                  -{discountPercent}%
                </span>
              )}
            </div>

            {/* Narrative Description */}
            <p className="text-xs sm:text-sm text-[#444444] leading-relaxed">
              {product.description}
            </p>

            {/* Dynamic Category Variants Architecture */}
            {(() => {
              if (!product.attributes || typeof product.attributes !== 'object') return null;

              const merchantAttributes = Object.entries(product.attributes)
                .map(([name, val]) => {
                  const options = String(val || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  return { name, options };
                })
                .filter(({ options }) => options.length > 0);

              if (merchantAttributes.length === 0) return null;

              return (
                <div className="space-y-4 pt-4 border-t border-[#1E1E1E]/20">
                  {merchantAttributes.map(({ name, options }) => {
                    const currentSelected = selectedVariants[name] || options[0];

                    return (
                      <div key={name} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono uppercase">
                          <span className="font-bold text-[#1E1E1E] tracking-wider">
                            {name}
                          </span>
                          <span className="text-[#DB4A2B] font-bold">
                            [{currentSelected}]
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {options.map((opt) => {
                            const isSelected =
                              currentSelected.toLowerCase() === opt.toLowerCase();
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() =>
                                  setSelectedVariants((prev) => ({
                                    ...prev,
                                    [name]: opt,
                                  }))
                                }
                                className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#1E1E1E] text-[#E4E2DD] border-2 border-[#1E1E1E]'
                                    : 'bg-[#FFFFFF] border border-[#1E1E1E]/30 text-[#1E1E1E] hover:border-[#1E1E1E]'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Quantity Stepper & Brutalist Purchase CTAs */}
            <div className="space-y-3 pt-2">
              <div className="flex items-stretch gap-3">
                {/* Rectangular Stepper */}
                <div className="flex items-center border-2 border-[#1E1E1E] bg-[#FFFFFF] px-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || addingToCart}
                    className="w-7 h-7 flex items-center justify-center text-[#1E1E1E] hover:text-[#DB4A2B] disabled:opacity-20 cursor-pointer"
                    title="Decrease"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-mono font-bold text-[#1E1E1E] min-w-[28px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock || addingToCart}
                    className="w-7 h-7 flex items-center justify-center text-[#1E1E1E] hover:text-[#DB4A2B] disabled:opacity-20 cursor-pointer"
                    title="Increase"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Section 11 Reusable Brutalist CTA Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0 || addingToCart}
                  className="flex-1 raw-btn py-4 px-6 bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E] text-xs font-bold uppercase tracking-widest cursor-pointer group disabled:opacity-40"
                >
                  {addingToCart ? (
                    <span>DISPATCHING...</span>
                  ) : addedRecently ? (
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Check className="w-4 h-4" />
                      ADDED TO BAG
                    </span>
                  ) : (
                    <span>ADD TO SHOPPING BAG</span>
                  )}
                </button>
              </div>

              {/* Instant Buy Now Button */}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={product.stock <= 0 || addingToCart}
                className="w-full py-3.5 px-6 bg-[#FFFFFF] hover:bg-[#1E1E1E] hover:text-[#E4E2DD] text-[#1E1E1E] border-2 border-[#1E1E1E] text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
              >
                PROCEED DIRECTLY TO CHECKOUT
              </button>
            </div>

            {/* Assurance Strip */}
            <div className="grid grid-cols-3 gap-2 py-4 border-t border-b border-[#1E1E1E]/20 text-center font-mono text-[10px] uppercase">
              <div className="space-y-1">
                <Truck className="w-4 h-4 text-[#DB4A2B] mx-auto" />
                <span className="font-bold text-[#1E1E1E] block">EXPRESS DISPATCH</span>
              </div>
              <div className="space-y-1">
                <RotateCcw className="w-4 h-4 text-[#DB4A2B] mx-auto" />
                <span className="font-bold text-[#1E1E1E] block">30-DAY SAGA REFUND</span>
              </div>
              <div className="space-y-1">
                <ShieldCheck className="w-4 h-4 text-[#DB4A2B] mx-auto" />
                <span className="font-bold text-[#1E1E1E] block">100% GENUINE</span>
              </div>
            </div>

            {/* Editorial Technical Accordions */}
            <div className="divide-y divide-[#1E1E1E]/20 text-xs font-mono uppercase">
              
              {/* Accordion: Specifications */}
              <div className="py-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion('specs')}
                  className="w-full flex items-center justify-between font-bold text-[#1E1E1E] tracking-wider cursor-pointer"
                >
                  <span>TECHNICAL SPECIFICATIONS</span>
                  <span className="text-sm font-bold text-[#DB4A2B]">
                    {accordions.specs ? '[-]' : '[+]'}
                  </span>
                </button>
                {accordions.specs && (
                  <div className="pt-3 space-y-2 normal-case font-satoshi">
                    {((product.specifications && product.specifications.length > 0) || (product.attributes && Object.keys(product.attributes).length > 0) || product.subcategory) ? (
                      <div className="border border-[#1E1E1E]/20 divide-y divide-[#1E1E1E]/15 bg-[#FFFFFF]">
                        {product.subcategory && (
                          <div className="flex items-center justify-between p-2.5 text-xs font-mono">
                            <span className="text-[#444444] uppercase">SUBCATEGORY</span>
                            <span className="font-bold text-[#1E1E1E] uppercase">{product.subcategory}</span>
                          </div>
                        )}
                        {product.attributes &&
                          Object.entries(product.attributes).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between p-2.5 text-xs font-mono">
                              <span className="text-[#444444] uppercase">{key}</span>
                              <span className="font-bold text-[#1E1E1E] uppercase">{val}</span>
                            </div>
                          ))}
                        {product.specifications &&
                          product.specifications
                            .filter((s) => !product.attributes || !product.attributes[s.key])
                            .map((s, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2.5 text-xs font-mono">
                                <span className="text-[#444444] uppercase">{s.key}</span>
                                <span className="font-bold text-[#1E1E1E] uppercase">{s.value}</span>
                              </div>
                            ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#444444] font-mono">
                        DEPARTMENT: {product.category.toUpperCase()} &bull; ARCHIVE SKU: {product._id.slice(-8).toUpperCase()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion: Shipping Protocols */}
              <div className="py-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full flex items-center justify-between font-bold text-[#1E1E1E] tracking-wider cursor-pointer"
                >
                  <span>FREIGHT & RETURN PROTOCOLS</span>
                  <span className="text-sm font-bold text-[#DB4A2B]">
                    {accordions.shipping ? '[-]' : '[+]'}
                  </span>
                </button>
                {accordions.shipping && (
                  <div className="pt-3 text-xs text-[#444444] leading-relaxed space-y-2 normal-case font-satoshi">
                    <p>
                      Orders processed within 24 operational hours. Automated courier routing with live telemetry. Free delivery on orders over $50.
                    </p>
                    <p>
                      Frictionless 30-day Saga transactional refund guarantees on all non-custom archive merchandise.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Frequently Bought Together Bundle */}
        <div className="mt-20">
          <FrequentlyBoughtTogether productId={product._id} />
        </div>

        {/* CUSTOMER REVIEWS SECTION */}
        <section id="reviews-section" className="mt-20 border-t-2 border-[#1E1E1E] pt-12 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#1E1E1E] pb-4">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#DB4A2B]">
                AUTHENTIC CUSTOMER TESTIMONIALS
              </span>
              <h3 className="font-clash text-2xl sm:text-4xl font-bold uppercase tracking-tight text-[#1E1E1E] mt-0.5">
                VERIFIED EVALUATIONS ({reviewCount})
              </h3>
            </div>

            <button
              type="button"
              onClick={() => {
                if (user?.role === 'company') {
                  openBusinessModal({ actionTitle: 'Write Review', productTitle: product.title });
                  return;
                }
                if (!user) {
                  navigate('/login');
                  return;
                }
                setIsWriteReviewModalOpen(true);
              }}
              className="px-5 py-2.5 bg-[#1E1E1E] hover:bg-[#DB4A2B] text-[#E4E2DD] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
            >
              <PenSquare className="w-3.5 h-3.5" />
              <span>{myReview ? 'EDIT YOUR EVALUATION' : 'WRITE EVALUATION'}</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setReviewRatingFilter(null)}
                className={`px-3 py-1 font-bold uppercase transition cursor-pointer ${
                  !reviewRatingFilter
                    ? 'bg-[#1E1E1E] text-[#E4E2DD]'
                    : 'bg-[#FFFFFF] border border-[#1E1E1E]/30 text-[#1E1E1E]'
                }`}
              >
                ALL
              </button>
              {[5, 4, 3].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRatingFilter(reviewRatingFilter === star ? null : star)}
                  className={`px-3 py-1 font-bold uppercase transition cursor-pointer ${
                    reviewRatingFilter === star
                      ? 'bg-[#1E1E1E] text-[#E4E2DD]'
                      : 'bg-[#FFFFFF] border border-[#1E1E1E]/30 text-[#1E1E1E]'
                  }`}
                >
                  {star}★
                </button>
              ))}
              <button
                type="button"
                onClick={() => setReviewWithPhotosFilter((p) => !p)}
                className={`px-3 py-1 font-bold uppercase transition cursor-pointer ${
                  reviewWithPhotosFilter
                    ? 'bg-[#1E1E1E] text-[#E4E2DD]'
                    : 'bg-[#FFFFFF] border border-[#1E1E1E]/30 text-[#1E1E1E]'
                }`}
              >
                WITH PHOTOS
              </button>
              <button
                type="button"
                onClick={() => setReviewVerifiedOnlyFilter((p) => !p)}
                className={`px-3 py-1 font-bold uppercase transition cursor-pointer ${
                  reviewVerifiedOnlyFilter
                    ? 'bg-[#1E1E1E] text-[#E4E2DD]'
                    : 'bg-[#FFFFFF] border border-[#1E1E1E]/30 text-[#1E1E1E]'
                }`}
              >
                VERIFIED PURCHASERS
              </button>
            </div>

            <select
              value={reviewSort}
              onChange={(e) => setReviewSort(e.target.value as any)}
              className="px-3 py-1 bg-[#FFFFFF] border border-[#1E1E1E] text-xs font-mono font-bold uppercase cursor-pointer"
            >
              <option value="newest">NEWEST</option>
              <option value="highest_rating">HIGHEST RATING</option>
              <option value="lowest_rating">LOWEST RATING</option>
            </select>
          </div>

          {/* Reviews List */}
          <div className="space-y-4 pt-2">
            {reviewsLoading ? (
              <div className="text-center py-10 font-mono text-xs text-[#444444]">
                QUERYING REVIEW REGISTRY...
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 bg-[#FFFFFF] border border-[#1E1E1E]/20 p-8 font-mono text-xs text-[#444444]">
                NO EVALUATIONS RECORDED YET FOR THIS SILHOUETTE.
              </div>
            ) : (
              reviews.map((rev) => (
                <ReviewCard
                  key={rev._id}
                  review={rev}
                  onEdit={() => setIsWriteReviewModalOpen(true)}
                  onDeleted={(deletedId) => {
                    setReviews((prev) => prev.filter((r) => r._id !== deletedId));
                    if (id) {
                      fetchReviews(id);
                      fetchProductData(id, true);
                    }
                  }}
                  onReviewUpdated={(updated) => {
                    setReviews((prev) =>
                      prev.map((r) => (r._id === updated._id ? updated : r))
                    );
                  }}
                  isMerchantOwner={Boolean(
                    user && (user._id === product.companyId || user.role === 'admin')
                  )}
                />
              ))
            )}
          </div>
        </section>

        {/* Related Products Showcase */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 space-y-8 border-t-2 border-[#1E1E1E] pt-12">
            <div className="flex items-end justify-between border-b-2 border-[#1E1E1E] pb-4">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#DB4A2B]">
                  PARALLEL ARCHIVES
                </span>
                <h3 className="font-clash text-2xl sm:text-4xl font-bold uppercase tracking-tight text-[#1E1E1E] mt-0.5">
                  CUSTOMERS ALSO EXPLORED
                </h3>
              </div>
              <Link
                to={`/?category=${encodeURIComponent(product.category)}`}
                className="font-mono text-xs font-bold uppercase tracking-wider text-[#1E1E1E] hover:text-[#DB4A2B] transition-colors"
              >
                VIEW FULL DEPARTMENT →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relProd, idx) => (
                <ProductCard key={relProd._id} product={relProd} index={idx} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Write Review Modal */}
      {product && (
        <WriteReviewModal
          isOpen={isWriteReviewModalOpen}
          onClose={() => setIsWriteReviewModalOpen(false)}
          productId={product._id}
          productTitle={product.title}
          productImage={product.images?.[0] || product.image}
          existingReview={myReview}
          onReviewSaved={(savedReview) => {
            setMyReview(savedReview);
            if (id) {
              fetchReviews(id);
              fetchProductData(id, true);
            }
          }}
        />
      )}
    </div>
  );
};

export default ProductDetailPage;
