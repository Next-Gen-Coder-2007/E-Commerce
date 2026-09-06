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
  Award,
  Leaf,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { ReviewCard } from '../components/reviews/ReviewCard';
import { FrequentlyBoughtTogether } from '../components/recommendations/FrequentlyBoughtTogether';
import { ProductCard } from '../components/ProductCard';
import { getProductByIdApi, getProductsApi } from '../services/productService';
import { getProductReviewsApi, getMyProductReviewApi } from '../services/reviewService';
import { WriteReviewModal } from '../components/reviews/WriteReviewModal';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import type { Product } from '../types/product';
import type { Review, ReviewSummary } from '../types/review';
import { getTaxonomyCategory } from '../config/taxonomy';

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

  // Minimalist collapsible accordions
  const [accordions, setAccordions] = useState<Record<string, boolean>>({
    details: true,
    specs: false,
    shipping: false,
    reviews: false,
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

        // Only initialize variants that the merchant actually specified on this product
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

        // Fetch related products in the same category
        try {
          const relData = await getProductsApi({
            category: data.product.category,
            limit: 4,
          });
          setRelatedProducts(
            (relData.products || []).filter((p) => p._id !== data.product._id)
          );
        } catch {
          // Non-critical
        }
      } else {
        setError('Product not found in marketplace catalog.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load product details.');
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

  // Load product details on initial mount or when product ID changes
  useEffect(() => {
    if (id) {
      fetchProductData(id);
      fetchMyReview(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [id, fetchProductData, fetchMyReview]);

  // Fetch reviews when filters or sort change
  useEffect(() => {
    if (id) {
      fetchReviews(id);
    }
  }, [id, fetchReviews]);

  // Live real-time sync when merchant updates product
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse space-y-8">
          <div className="h-4 bg-neutral-100 rounded-md w-1/4" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-6 aspect-square bg-neutral-100 rounded-3xl" />
            <div className="lg:col-span-6 space-y-4">
              <div className="h-4 bg-neutral-100 rounded w-1/4" />
              <div className="h-10 bg-neutral-100 rounded w-3/4" />
              <div className="h-6 bg-neutral-100 rounded w-1/3" />
              <div className="h-24 bg-neutral-100 rounded-xl w-full" />
              <div className="h-12 bg-neutral-100 rounded-full w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center space-y-6">
        <h2 className="text-2xl font-serif text-neutral-900">Product Unavailable</h2>
        <p className="text-sm text-neutral-500">
          {error || "The product you're searching for is unavailable or has been discontinued."}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold text-white bg-neutral-950 hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Marketplace
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

  // Determine variant options matching reference
  const isBeauty =
    product.category?.toLowerCase() === 'beauty' ||
    product.category?.toLowerCase() === 'skincare' ||
    product.category?.toLowerCase() === 'cosmetics';
  const isFashion =
    product.category?.toLowerCase() === 'fashion' ||
    product.category?.toLowerCase() === 'clothing' ||
    product.category?.toLowerCase() === 'apparel';

  const variantOptions = isBeauty
    ? ['50ml', '100ml']
    : isFashion
    ? ['S', 'M', 'L', 'XL']
    : ['Standard', 'Pro Edition'];

  const inWish = isInWishlist(product._id);

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white pb-24">
      {/* Minimalist Top Breadcrumb Bar */}
      <div className="border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between text-xs text-neutral-400">
          <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
            <Link to="/" className="hover:text-neutral-900 transition-colors">
              Marketplace
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
            <Link
              to={`/?category=${encodeURIComponent(product.category)}`}
              className="capitalize hover:text-neutral-900 transition-colors"
            >
              {product.category}
            </Link>
            {product.subcategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                <Link
                  to={`/?category=${encodeURIComponent(product.category)}&subcategory=${encodeURIComponent(product.subcategory)}`}
                  className="hover:text-neutral-900 transition-colors font-medium text-neutral-600"
                >
                  {product.subcategory}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
            <span className="text-neutral-900 truncate max-w-[220px]">
              {product.title}
            </span>
          </nav>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 hover:border-neutral-900 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer text-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-neutral-900" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Editorial Product Showcase Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 items-start">
          
          {/* LEFT GALLERY: Vertical Thumbnail Strip + Clean Hero Showcase (7 cols) */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4 sm:gap-6 items-start">
            
            {/* Vertical Thumbnails List */}
            {productPhotos.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[540px] no-scrollbar shrink-0 w-full sm:w-20">
                {productPhotos.map((photoUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-neutral-50/70 border p-1 transition-all cursor-pointer shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-neutral-950 ring-1 ring-neutral-950 opacity-100'
                        : 'border-neutral-200 hover:border-neutral-400 opacity-60 hover:opacity-100'
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

            {/* Center Canvas: High Whitespace Product Showcase */}
            <div className="relative flex-1 w-full aspect-square sm:aspect-[4/5] max-h-[580px] rounded-3xl bg-[#fbfbfb] border border-neutral-100 p-8 sm:p-12 flex items-center justify-center overflow-hidden group">
              {/* Minimalist Pill Badge (e.g. BEST SELLER) */}
              <span className="absolute top-5 left-5 px-3 py-1 rounded-full border border-neutral-200/90 bg-white/95 text-[10px] uppercase font-semibold tracking-widest text-neutral-800 shadow-2xs">
                {product.isFlashSale ? 'FEATURED DEAL' : 'BEST SELLER'}
              </span>

              {/* Primary Product Image */}
              <img
                src={activePhoto}
                alt={product.title}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 select-none"
              />

              {/* Discreet Wishlist Pill Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`absolute top-5 right-5 w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  inWish
                    ? 'bg-neutral-950 border-neutral-950 text-white'
                    : 'bg-white/90 border-neutral-200 text-neutral-400 hover:text-neutral-950 hover:border-neutral-900'
                }`}
                title={inWish ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart className={`w-4 h-4 ${inWish ? 'fill-white' : ''}`} />
              </button>

              {/* Subtle navigation arrows if multiple photos */}
              {productPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImageIndex((prev) =>
                        prev === 0 ? productPhotos.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-neutral-200 text-neutral-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-white"
                  >
                    <ChevronUp className="w-4 h-4 -rotate-90" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImageIndex((prev) =>
                        prev === productPhotos.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-neutral-200 text-neutral-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-white"
                  >
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Minimalist Editorial Information & Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            {/* Brand / Merchant Tag */}
            <div className="text-xs uppercase tracking-[0.25em] text-neutral-400 font-semibold mb-2">
              {product.companyName || product.category || 'EVERYDAY HUMANS'}
            </div>

            {/* Editorial Title */}
            <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 font-normal tracking-tight leading-[1.2] mb-3">
              {product.title}
            </h1>

            {/* Star Rating & Review Count */}
            <div className="flex items-center gap-2 mb-4 text-xs">
              <div className="flex items-center gap-0.5 text-neutral-900">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(rating || 5)
                        ? 'fill-neutral-900 text-neutral-900'
                        : 'fill-neutral-200 text-neutral-200'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setAccordions((prev) => ({ ...prev, reviews: true }));
                  const revEl = document.getElementById('reviews-accordion');
                  if (revEl) revEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
              >
                ({reviewCount} reviews)
              </button>
            </div>

            {/* Price Line */}
            <div className="flex items-baseline gap-2.5 mb-4">
              <span className="text-xl sm:text-2xl font-bold text-neutral-950 font-sans">
                ${product.price.toFixed(2)}
              </span>
              {hasRealDiscount && listPrice && (
                <span className="text-sm text-neutral-400 line-through font-normal">
                  ${listPrice}
                </span>
              )}
              {hasRealDiscount && discountPercent > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-neutral-200 bg-neutral-100 text-neutral-800">
                  -{discountPercent}%
                </span>
              )}
            </div>

            {/* Editorial Narrative Description */}
            <p className="text-sm text-neutral-600 leading-relaxed max-w-lg mb-6 font-normal">
              {product.description}
            </p>

            {/* Merchant-Configured Variants & Options */}
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
                <div className="mb-6 space-y-4 pt-1 border-t border-b border-neutral-100 py-4">
                  {merchantAttributes.map(({ name, options }) => {
                    const currentSelected = selectedVariants[name] || options[0];

                    return (
                      <div key={name} className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-neutral-800 uppercase tracking-wider">
                            {name}
                          </span>
                          <span className="text-neutral-500 font-medium">
                            {currentSelected}
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
                                className={`px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-neutral-950 text-white font-bold shadow-xs scale-[1.02]'
                                    : 'bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 font-medium'
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

            {/* Quantity Stepper + Add to Cart + Wishlist Action Row */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                {/* Stepper Pill */}
                <div className="flex items-center border border-neutral-200 rounded-full px-3.5 py-2.5 bg-white shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || addingToCart}
                    className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-neutral-950 disabled:opacity-30 cursor-pointer"
                    title="Decrease"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-neutral-950 min-w-[24px] text-center font-mono">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock || addingToCart}
                    className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-neutral-950 disabled:opacity-30 cursor-pointer"
                    title="Increase"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* ADD TO CART Bold Black Pill Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0 || addingToCart}
                  className="flex-1 py-3.5 px-8 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {addingToCart ? (
                    <span>Adding...</span>
                  ) : addedRecently ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                      Added to Cart
                    </span>
                  ) : (
                    <span>Add To Cart</span>
                  )}
                </button>

                {/* Circular Wishlist Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    inWish
                      ? 'border-neutral-950 bg-neutral-950 text-white'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-900 hover:text-neutral-950'
                  }`}
                  title={inWish ? 'Saved in wishlist' : 'Save to wishlist'}
                >
                  <Heart className={`w-4 h-4 ${inWish ? 'fill-white' : ''}`} />
                </button>
              </div>

              {/* Free Shipping Line */}
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 pt-1">
                <span>Ships for free on all qualifying marketplace orders.</span>
                <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              </div>
            </div>

            {/* 4 Minimal Trust Icons (Matching reference Oh My Bod! footer pillars) */}
            <div className="grid grid-cols-4 gap-2 py-6 border-t border-b border-neutral-100 my-4 text-center">
              <div className="space-y-1.5">
                <ShieldCheck className="w-5 h-5 text-neutral-900 mx-auto" />
                <span className="text-[11px] font-medium text-neutral-600 block leading-tight">
                  Safe & Non-toxic
                </span>
              </div>
              <div className="space-y-1.5">
                <Award className="w-5 h-5 text-neutral-900 mx-auto" />
                <span className="text-[11px] font-medium text-neutral-600 block leading-tight">
                  Dermatologist Tested
                </span>
              </div>
              <div className="space-y-1.5">
                <Leaf className="w-5 h-5 text-neutral-900 mx-auto" />
                <span className="text-[11px] font-medium text-neutral-600 block leading-tight">
                  Biodegradable
                </span>
              </div>
              <div className="space-y-1.5">
                <RotateCcw className="w-5 h-5 text-neutral-900 mx-auto" />
                <span className="text-[11px] font-medium text-neutral-600 block leading-tight">
                  Vegan & Cruelty-Free
                </span>
              </div>
            </div>

            {/* Clean Expandable Minimal Accordions */}
            <div className="divide-y divide-neutral-100 text-xs">
              
              {/* Accordion 1: Detail */}
              <div className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('details')}
                  className="w-full flex items-center justify-between font-semibold text-neutral-900 uppercase tracking-wider cursor-pointer hover:text-neutral-600 transition-colors"
                >
                  <span>Detail</span>
                  <span className="text-base font-light text-neutral-500">
                    {accordions.details ? '−' : '+'}
                  </span>
                </button>
                {accordions.details && (
                  <div className="pt-3 text-neutral-600 leading-relaxed space-y-2 font-normal">
                    <p>{product.description}</p>
                    <div className="pt-2 flex items-center gap-2 text-neutral-400">
                      <span>Brand / Merchant:</span>
                      <strong className="text-neutral-800 font-medium">
                        {product.companyName || 'Verified Merchant'}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: Specifications */}
              <div className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('specs')}
                  className="w-full flex items-center justify-between font-semibold text-neutral-900 uppercase tracking-wider cursor-pointer hover:text-neutral-600 transition-colors"
                >
                  <span>Specifications</span>
                  <span className="text-base font-light text-neutral-500">
                    {accordions.specs ? '−' : '+'}
                  </span>
                </button>
                {accordions.specs && (
                  <div className="pt-3 space-y-2">
                    {((product.specifications && product.specifications.length > 0) || (product.attributes && Object.keys(product.attributes).length > 0) || product.subcategory) ? (
                      <div className="border border-neutral-100 rounded-xl overflow-hidden divide-y divide-neutral-100">
                        {product.subcategory && (
                          <div className="flex items-center justify-between p-2.5 bg-neutral-50/50">
                            <span className="text-neutral-500 font-medium">Subcategory</span>
                            <span className="text-neutral-900 font-semibold">{product.subcategory}</span>
                          </div>
                        )}
                        {product.attributes &&
                          Object.entries(product.attributes).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between p-2.5 bg-neutral-50/50">
                              <span className="text-neutral-500">{key}</span>
                              <span className="text-neutral-900 font-medium">{val}</span>
                            </div>
                          ))}
                        {product.specifications &&
                          product.specifications
                            .filter((s) => !product.attributes || !product.attributes[s.key])
                            .map((s, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2.5 bg-neutral-50/50">
                                <span className="text-neutral-500">{s.key}</span>
                                <span className="text-neutral-900 font-medium">{s.value}</span>
                              </div>
                            ))}
                      </div>
                    ) : (
                      <p className="text-neutral-500">
                        Category: {product.category} • SKU: {product._id.slice(-6).toUpperCase()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 3: Shipping & Returns */}
              <div className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full flex items-center justify-between font-semibold text-neutral-900 uppercase tracking-wider cursor-pointer hover:text-neutral-600 transition-colors"
                >
                  <span>Shipping & Returns</span>
                  <span className="text-base font-light text-neutral-500">
                    {accordions.shipping ? '−' : '+'}
                  </span>
                </button>
                {accordions.shipping && (
                  <div className="pt-3 text-neutral-600 leading-relaxed space-y-2 font-normal">
                    <p>
                      Orders processed within 24 business hours. Free express shipping eligible on orders above $50.
                    </p>
                    <p>
                      Hassle-free 30-day return policy on unused and unopened merchandise.
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 4: Customer Reviews */}
              <div id="reviews-accordion" className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('reviews')}
                  className="w-full flex items-center justify-between font-semibold text-neutral-900 uppercase tracking-wider cursor-pointer hover:text-neutral-600 transition-colors"
                >
                  <span>Reviews ({reviewCount})</span>
                  <span className="text-base font-light text-neutral-500">
                    {accordions.reviews ? '−' : '+'}
                  </span>
                </button>
                {accordions.reviews && (
                  <div className="pt-4 space-y-6">
                    {/* Header + Write review button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold font-serif text-neutral-900">
                          {rating.toFixed(1)}
                        </span>
                        <div className="flex items-center gap-0.5 text-neutral-900">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(rating || 5)
                                  ? 'fill-neutral-900 text-neutral-900'
                                  : 'fill-neutral-200 text-neutral-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (user?.role === 'company') {
                            openBusinessModal({
                              actionTitle: 'Write Review',
                              productTitle: product.title,
                            });
                            return;
                          }
                          if (!user) {
                            navigate('/login');
                            return;
                          }
                          setIsWriteReviewModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-neutral-200 hover:border-neutral-900 text-neutral-900 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <PenSquare className="w-3.5 h-3.5" />
                        <span>{myReview ? 'Edit Review' : 'Write Review'}</span>
                      </button>
                    </div>

                    {/* Filter & Sort Controls */}
                    <div className="flex items-center justify-between gap-2 text-[11px] pt-1 border-t border-neutral-100">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setReviewRatingFilter(null)}
                          className={`px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                            !reviewRatingFilter
                              ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
                              : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                          }`}
                        >
                          All
                        </button>
                        {[5, 4, 3].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              setReviewRatingFilter(reviewRatingFilter === star ? null : star)
                            }
                            className={`px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                              reviewRatingFilter === star
                                ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
                                : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                            }`}
                          >
                            {star}★
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setReviewWithPhotosFilter((p) => !p)}
                          className={`px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                            reviewWithPhotosFilter
                              ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
                              : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                          }`}
                        >
                          Photos
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewVerifiedOnlyFilter((p) => !p)}
                          className={`px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                            reviewVerifiedOnlyFilter
                              ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
                              : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                          }`}
                        >
                          Verified
                        </button>
                      </div>

                      <select
                        value={reviewSort}
                        onChange={(e) => setReviewSort(e.target.value as any)}
                        className="border border-neutral-200 rounded-lg px-2 py-1 bg-white text-neutral-800 text-[11px] cursor-pointer"
                      >
                        <option value="newest">Newest</option>
                        <option value="highest_rating">Highest</option>
                        <option value="lowest_rating">Lowest</option>
                      </select>
                    </div>

                    {/* Review Cards List */}
                    <div className="space-y-3 pt-2">
                      {reviewsLoading ? (
                        <div className="text-center py-6 text-neutral-400">Loading reviews...</div>
                      ) : reviews.length === 0 ? (
                        <div className="text-center py-6 text-neutral-500 font-normal">
                          No reviews match your filter yet.
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

        {/* Related Products: Customers Also Viewed using our Minimalist ProductCard */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 space-y-8">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-serif text-neutral-900 font-normal">
                  Customers Also Viewed
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Minimalist curation from {product.category}
                </p>
              </div>
              <Link
                to={`/?category=${product.category}`}
                className="text-xs uppercase tracking-wider font-semibold text-neutral-900 hover:text-neutral-500 transition-colors"
              >
                View Collection →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
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
