import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Share2,
  Check,
  ChevronRight,
  ArrowLeft,
  Building2,
  ShoppingCart,
  Zap,
  AlertCircle,
  CheckCircle2,
  Heart,
  Layers,
  Sparkles,
  ExternalLink,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Store,
  ChevronLeft,
  Image as ImageIcon,
  Sliders,
  Info,
  PenSquare,
  Camera,
  Ticket,
} from 'lucide-react';
import { ReviewCard } from '../components/reviews/ReviewCard';
import { FrequentlyBoughtTogether } from '../components/recommendations/FrequentlyBoughtTogether';
import { getProductByIdApi, getProductsApi } from '../services/productService';
import { getProductReviewsApi, getMyProductReviewApi } from '../services/reviewService';
import { getAvailableCouponsApi } from '../services/couponService';
import { WriteReviewModal } from '../components/reviews/WriteReviewModal';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import type { Product } from '../types/product';
import type { Review, ReviewSummary } from '../types/review';
import type { Coupon } from '../types/coupon';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, items, updateQuantity, removeFromCart, openBusinessModal, actionLoading, openCart } = useCart();
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
  const [buyingNow, setBuyingNow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews' | 'shipping'>('details');

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

  // Available Store & Product Coupons
  const [productCoupons, setProductCoupons] = useState<Coupon[]>([]);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);

  const fetchProductData = useCallback(async (productId: string, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getProductByIdApi(productId);
      if (data.product) {
        setProduct(data.product);
        setQuantity((prev) => Math.max(1, Math.min(prev, data.product.stock || 1)));
        
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

        // Fetch available coupons for this product / seller
        try {
          const couponData = await getAvailableCouponsApi({
            productId: data.product._id,
            companyId: data.product.companyId,
          });
          if (couponData.success && couponData.coupons) {
            setProductCoupons(couponData.coupons);
          }
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

  // Fetch reviews independently when filters or sort change (does not reload the product page)
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
    if (!product || product.stock <= 0) return;
    if (user?.role === 'company') {
      openBusinessModal({ actionTitle: 'Buy Now', productTitle: product.title });
      return;
    }
    setBuyingNow(true);
    try {
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
        },
        false
      );
      if (success) {
        navigate('/checkout');
      }
    } finally {
      setBuyingNow(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-4 bg-zinc-200 rounded w-1/4" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 aspect-square bg-zinc-200 rounded-3xl" />
            <div className="lg:col-span-4 space-y-4">
              <div className="h-8 bg-zinc-200 rounded w-3/4" />
              <div className="h-4 bg-zinc-200 rounded w-1/2" />
              <div className="h-10 bg-zinc-200 rounded w-1/3" />
              <div className="space-y-2 pt-4">
                <div className="h-4 bg-zinc-200 rounded" />
                <div className="h-4 bg-zinc-200 rounded" />
                <div className="h-4 bg-zinc-200 rounded w-5/6" />
              </div>
            </div>
            <div className="lg:col-span-3 h-80 bg-zinc-200 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-950">Product Not Found</h2>
        <p className="text-sm text-zinc-600">
          {error || "The product you're searching for is unavailable or has been discontinued."}
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  // Derived data (strictly based on actual merchant discount settings)
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
  const reviewCount = product.numReviews || 0;
  const rating = reviewCount > 0 ? (product.rating || 0) : 0;

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      {/* Top Breadcrumb Bar */}
      <div className="bg-white border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs text-zinc-500">
          <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
            <Link to="/" className="hover:text-zinc-900 transition-colors">
              Marketplace
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <Link
              to={`/?category=${product.category}`}
              className="capitalize hover:text-zinc-900 transition-colors"
            >
              {product.category}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="font-medium text-zinc-900 truncate max-w-[200px] sm:max-w-xs">
              {product.title}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-medium transition-colors cursor-pointer shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Link Copied</span>
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
      </div>

      {/* Main Product Showcase Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Column 1: Image Showcase (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {(() => {
              const productPhotos =
                product.images && product.images.length > 0
                  ? product.images
                  : [product.image];
              const activePhoto =
                productPhotos[selectedImageIndex] || productPhotos[0] || product.image;

              return (
                <>
                  <div className="relative aspect-square rounded-3xl bg-white border border-zinc-200 p-4 shadow-sm overflow-hidden group">
                    <img
                      src={activePhoto}
                      alt={`${product.title} - Photo ${selectedImageIndex + 1}`}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Category Tag */}
                    <span className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                      {product.category}
                    </span>

                    {/* Discount & Flash Sale Badges */}
                    {hasRealDiscount && discountPercent > 0 && (
                      <span className="absolute bottom-4 left-4 px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-black shadow-md tracking-wider">
                        -{discountPercent}% OFF
                      </span>
                    )}
                    {product.isFlashSale && (
                      <span className="absolute top-4 left-24 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-white" />
                        <span>Flash Deal</span>
                      </span>
                    )}

                    {/* Photo Counter Pill */}
                    {productPhotos.length > 1 && (
                      <span className="absolute bottom-4 right-4 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-zinc-300" />
                        <span>{selectedImageIndex + 1} / {productPhotos.length}</span>
                      </span>
                    )}

                    {/* Navigation Arrows for Multi-Photo Gallery */}
                    {productPhotos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImageIndex((idx) =>
                              idx === 0 ? productPhotos.length - 1 : idx - 1
                            );
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-zinc-200 text-zinc-900 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Previous Photo"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImageIndex((idx) =>
                              idx === productPhotos.length - 1 ? 0 : idx + 1
                            );
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-zinc-200 text-zinc-900 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Next Photo"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      onClick={() => setIsWishlisted(!isWishlisted)}
                      className={`absolute top-4 right-4 p-2.5 rounded-full border transition-all cursor-pointer shadow-2xs ${
                        isWishlisted
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : 'bg-white/90 border-zinc-200 text-zinc-600 hover:text-zinc-950'
                      }`}
                      title="Save to Wishlist"
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                    </button>
                  </div>

                  {/* Thumbnail Row of Reference Photos (Up to 10 photos) */}
                  {productPhotos.length > 1 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 px-1">
                        <span>Product Reference Gallery</span>
                        <span>{productPhotos.length} Photos Available</span>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {productPhotos.map((photoUrl, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setSelectedImageIndex(pIdx)}
                            className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-white border-2 p-0.5 transition-all cursor-pointer ${
                              selectedImageIndex === pIdx
                                ? 'border-zinc-950 ring-2 ring-zinc-950/20 shadow-xs scale-105'
                                : 'border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={photoUrl}
                              alt={`Thumbnail ${pIdx + 1}`}
                              className="w-full h-full object-contain rounded-lg"
                            />
                            <span className="absolute bottom-1 right-1 px-1 rounded bg-zinc-950/80 text-[9px] font-mono font-bold text-white leading-tight">
                              {pIdx + 1}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feature Badges Banner */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div className="rounded-xl border border-zinc-200 p-2.5 bg-zinc-50 flex flex-col items-center justify-center text-center text-[10px] text-zinc-500 font-medium">
                      <ShieldCheck className="w-4 h-4 text-indigo-600 mb-0.5" />
                      <span>100% Verified</span>
                    </div>
                    <div className="rounded-xl border border-zinc-200 p-2.5 bg-zinc-50 flex flex-col items-center justify-center text-center text-[10px] text-zinc-500 font-medium">
                      <Truck className="w-4 h-4 text-emerald-600 mb-0.5" />
                      <span>Fast Shipping</span>
                    </div>
                    <div className="rounded-xl border border-zinc-200 p-2.5 bg-zinc-50 flex flex-col items-center justify-center text-center text-[10px] text-zinc-500 font-medium">
                      <RotateCcw className="w-4 h-4 text-amber-600 mb-0.5" />
                      <span>30-Day Returns</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Column 2: Product Information (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Link
                  to={`/store/${encodeURIComponent(product.companyName || product.companyId)}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-200 transition-colors"
                  title={`Visit ${product.companyName} Storefront`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{product.companyName || 'Verified Merchant Store'}</span>
                </Link>
                <span className="text-[11px] text-zinc-400 font-mono">
                  SKU: {product._id.slice(-6).toUpperCase()}
                </span>
              </div>

              {product.isFlashSale && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-extrabold">
                  <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>Official Merchant Flash Sale Featured Deal</span>
                </div>
              )}

              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight leading-tight">
                {product.title}
              </h1>

              {/* Ratings */}
              <div className="flex items-center gap-3 pt-1">
                {reviewCount > 0 ? (
                  <>
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            rating > 0 && i < Math.floor(rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-zinc-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-zinc-900">
                      {rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-zinc-400">|</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('reviews')}
                      className="text-xs text-indigo-600 hover:underline font-medium cursor-pointer"
                    >
                      {reviewCount} {reviewCount === 1 ? 'rating' : 'ratings'}
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-medium">
                      No ratings yet
                    </span>
                    <span className="text-[10px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full font-medium">
                      New Listing
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Price Block */}
            <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-zinc-950">
                  ${product.price.toFixed(2)}
                </span>
                {hasRealDiscount && listPrice && (
                  <span className="text-sm text-zinc-400 line-through">
                    ${listPrice}
                  </span>
                )}
                {hasRealDiscount && discountPercent > 0 && (
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    Save {discountPercent}%
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500">
                Inclusive of all applicable taxes. Free shipping eligible on checkout.
              </p>
            </div>

            {/* Available Store Coupons Banner */}
            {productCoupons.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Ticket className="w-4 h-4 text-emerald-600" />
                    <span>Available Store Coupons & Offers</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    {productCoupons.length} {productCoupons.length === 1 ? 'offer' : 'offers'}
                  </span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {productCoupons.map((cp) => (
                    <div
                      key={cp._id || cp.code}
                      className="bg-white border border-emerald-200 rounded-xl p-2.5 shadow-2xs shrink-0 min-w-[200px] flex flex-col justify-between space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-zinc-950 text-white">
                          {cp.code}
                        </span>
                        <span className="text-xs font-bold text-emerald-700">
                          {cp.discountType === 'percentage'
                            ? `${cp.discountValue}% OFF`
                            : `$${cp.discountValue.toFixed(2)} OFF`}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-600 line-clamp-1">
                        {cp.description}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-100 text-[9px]">
                        <span className="text-zinc-400">
                          {cp.minPurchaseAmount > 0 ? `Min. $${cp.minPurchaseAmount.toFixed(2)}` : 'No minimum'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(cp.code);
                            setCopiedCouponCode(cp.code);
                            setTimeout(() => setCopiedCouponCode(null), 2000);
                          }}
                          className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                        >
                          {copiedCouponCode === cp.code ? 'Copied' : 'Copy Code'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Technical Highlights (Key-Value Summary for Buyers) */}
            {product.specifications && product.specifications.length > 0 && (
              <div className="p-4 rounded-2xl bg-zinc-50/90 border border-zinc-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-950 uppercase tracking-wider">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Technical Highlights</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('specs')}
                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <span>Full Specs ({product.specifications.length})</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {product.specifications.slice(0, 4).map((spec, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-2 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-0.5"
                    >
                      <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider truncate">
                        {spec.key}
                      </div>
                      <div className="font-bold text-zinc-900 truncate">
                        {spec.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Highlights */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                About this item
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Spec Quick Table */}
            <div className="border-t border-b border-zinc-200/80 py-4 space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-zinc-500 font-medium">Department</span>
                <span className="col-span-2 text-zinc-900 font-semibold capitalize">{product.category}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-zinc-500 font-medium">Warehouse Stock</span>
                <span className="col-span-2 text-zinc-900 font-semibold">{product.stock} units available</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-zinc-500 font-medium">Fulfillment</span>
                <span className="col-span-2 text-emerald-700 font-semibold">NovaCommerce Prime Network</span>
              </div>
            </div>
          </div>

          {/* Column 3: Sticky Buy Box (3 Cols) */}
          <div className="lg:col-span-3 sticky top-20 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-5">
              <div>
                <span className="text-2xl font-extrabold text-zinc-950">
                  ${product.price.toFixed(2)}
                </span>
                <div className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  FREE Delivery by Tomorrow
                </div>
              </div>

              {/* Stock status */}
              <div>
                {product.stock > 10 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> In Stock
                  </span>
                ) : product.stock > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600">
                    <AlertCircle className="w-4 h-4" /> Only {product.stock} left in stock - order soon
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600">
                    <AlertCircle className="w-4 h-4" /> Currently Out of Stock
                  </span>
                )}
              </div>

              {/* In-Cart Sync Notice Banner */}
              {(() => {
                const cartItem = items.find((i) => i.productId === product._id);
                if (!cartItem) return null;
                return (
                  <div className="p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-950 block">
                          {cartItem.quantity} unit{cartItem.quantity > 1 ? 's' : ''} in cart
                        </span>
                        <span className="text-[11px] text-emerald-700 font-mono">
                          ${(product.price * cartItem.quantity).toFixed(2)} subtotal
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCart()}
                      className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100/60 transition-colors cursor-pointer shadow-2xs"
                    >
                      View Cart
                    </button>
                  </div>
                );
              })()}

              {/* Quantity Selector */}
              {product.stock > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Quantity
                    </label>
                    <span className="text-xs font-semibold text-zinc-500">
                      Total: <strong className="text-zinc-950 font-bold font-mono">${(product.price * quantity).toFixed(2)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center border border-zinc-200 rounded-2xl bg-zinc-50/80 p-1.5 w-full justify-between shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || addingToCart}
                      className="w-9 h-9 rounded-xl bg-white border border-zinc-200/80 text-zinc-800 hover:text-zinc-950 font-extrabold flex items-center justify-center hover:bg-zinc-100 disabled:opacity-30 cursor-pointer shadow-2xs transition-all active:scale-95"
                      title="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-base font-black font-mono text-zinc-950 leading-none">
                        {quantity}
                      </span>
                      <span className="text-[9px] text-zinc-400 font-medium mt-0.5">
                        {product.stock} available
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      disabled={quantity >= product.stock || addingToCart}
                      className="w-9 h-9 rounded-xl bg-white border border-zinc-200/80 text-zinc-800 hover:text-zinc-950 font-extrabold flex items-center justify-center hover:bg-zinc-100 disabled:opacity-30 cursor-pointer shadow-2xs transition-all active:scale-95"
                      title="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Business Account Notice */}
              {user?.role === 'company' && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-amber-950">
                    <Building2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>Business Account Active</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-snug">
                    You are logged in as <strong>{user.companyName || user.name}</strong>. Retail ordering is restricted for merchant accounts.
                  </p>
                </div>
              )}

              {/* CTAs */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0 || addingToCart}
                  className={`w-full py-3.5 px-4 rounded-2xl text-xs font-extrabold active:scale-[0.98] transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    addedRecently
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30'
                      : 'text-zinc-950 bg-amber-400 hover:bg-amber-300 shadow-amber-400/20'
                  }`}
                >
                  {addingToCart ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      <span>Adding to Cart...</span>
                    </>
                  ) : addedRecently ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Added to Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>
                        {items.find((i) => i.productId === product._id)
                          ? `Add +${quantity} More • $${(product.price * quantity).toFixed(2)}`
                          : `Add to Cart • $${(product.price * quantity).toFixed(2)}`}
                      </span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0 || buyingNow}
                  className="w-full py-3.5 px-4 rounded-2xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {buyingNow ? 'Processing...' : 'Buy Now • Instant Checkout'}
                </button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => product && toggleWishlist(product)}
                  className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                    product && isInWishlist(product._id)
                      ? 'bg-pink-50 border-pink-300 text-pink-700 hover:bg-pink-100 shadow-2xs'
                      : 'bg-white border-zinc-200 text-zinc-700 hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50/50 shadow-2xs'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${product && isInWishlist(product._id) ? 'fill-pink-600 text-pink-600' : 'text-zinc-500'}`} />
                  <span>{product && isInWishlist(product._id) ? 'Saved in Wishlist' : 'Save to Wishlist & Track Price Drops'}</span>
                </button>
              </div>

              {/* Merchant Details */}
              <div className="pt-3 border-t border-zinc-200/80 space-y-1.5 text-[11px] text-zinc-500">
                <div className="flex justify-between">
                  <span>Dispatches from</span>
                  <span className="text-zinc-900 font-medium">NovaCommerce</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sold by</span>
                  <Link
                    to={`/store/${encodeURIComponent(product.companyName || product.companyId)}`}
                    className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
                    title={`Visit ${product.companyName} Storefront`}
                  >
                    <span>{product.companyName || 'Verified Merchant'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span>Buyer Protection</span>
                  <span className="text-emerald-700 font-medium">Verified Guarantee</span>
                </div>

                <div className="pt-2">
                  <Link
                    to={`/store/${encodeURIComponent(product.companyName || product.companyId)}`}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Store className="w-3.5 h-3.5 text-zinc-700" />
                    <span>Visit Merchant Storefront</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Frequently Bought Together Bundle */}
        {product && <FrequentlyBoughtTogether productId={product._id} />}

        {/* Detailed Tabs (Description, Specs, Reviews, Shipping) */}
        <div className="mt-16 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8">
          <div className="flex items-center gap-2 border-b border-zinc-200 overflow-x-auto no-scrollbar pb-px">
            {[
              { id: 'details', label: 'Product Details' },
              { id: 'specs', label: 'Technical Specifications' },
              { id: 'reviews', label: `Customer Reviews (${reviewCount})` },
              { id: 'shipping', label: 'Shipping & Returns' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-zinc-950 text-zinc-950'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="space-y-6 max-w-3xl">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Product Overview</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                  <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Premium Build Quality
                  </div>
                  <p className="text-xs text-zinc-500">
                    Engineered with verified enterprise standards and rigorous quality assurance.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                  <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Microservices Telemetry
                  </div>
                  <p className="text-xs text-zinc-500">
                    Real-time stock reservation and order lifecycle sync through Port 5002 catalog.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-950">Technical Specifications</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Comprehensive hardware, design, and reference attributes for {product.title}
                </p>
              </div>

              {/* Merchant Defined Key-Value Specifications */}
              {product.specifications && product.specifications.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
                    <div className="flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <span>Product Attributes & Technical Specifications</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-normal">
                      {product.specifications.length} verified specifications
                    </span>
                  </div>

                  <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs divide-y divide-zinc-200 text-xs">
                    {product.specifications.map((spec, sIdx) => (
                      <div
                        key={sIdx}
                        className={`grid grid-cols-1 sm:grid-cols-12 p-3.5 transition-colors ${
                          sIdx % 2 === 0 ? 'bg-zinc-50/70' : 'bg-white'
                        }`}
                      >
                        <div className="sm:col-span-4 font-bold text-zinc-700 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                          <span>{spec.key}</span>
                        </div>
                        <div className="sm:col-span-8 text-zinc-950 font-semibold sm:pl-4 mt-1 sm:mt-0 break-words">
                          {spec.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Standard marketplace catalog telemetry applies for this item. Core logistic specs are detailed below.</span>
                </div>
              )}

              {/* Core Catalog and Logistics Telemetry */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Catalog & Logistics Details
                </h4>
                <div className="border border-zinc-200 rounded-2xl overflow-hidden divide-y divide-zinc-200 text-xs shadow-2xs">
                  <div className="grid grid-cols-1 sm:grid-cols-12 p-3.5 bg-zinc-50/70 font-medium">
                    <span className="sm:col-span-4 text-zinc-500">Product Model ID</span>
                    <span className="sm:col-span-8 text-zinc-900 font-mono sm:pl-4">{product._id}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 p-3.5 bg-white font-medium">
                    <span className="sm:col-span-4 text-zinc-500">Merchant Entity ID</span>
                    <span className="sm:col-span-8 text-zinc-900 font-mono sm:pl-4">{product.companyId}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 p-3.5 bg-zinc-50/70 font-medium">
                    <span className="sm:col-span-4 text-zinc-500">Department / Category</span>
                    <span className="sm:col-span-8 text-zinc-900 font-semibold capitalize sm:pl-4">{product.category}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 p-3.5 bg-white font-medium">
                    <span className="sm:col-span-4 text-zinc-500">Inventory Status</span>
                    <span className="sm:col-span-8 text-emerald-700 font-bold sm:pl-4">{product.stock} Units Ready for Immediate Dispatch</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div id="reviews" className="space-y-8 max-w-4xl">
              {/* Header & Write Review Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-zinc-950 tracking-tight">
                    Customer Reviews & Ratings
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Real, verified feedback and photos from customers who bought {product.title}
                  </p>
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
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
                >
                  <PenSquare className="w-4 h-4 text-amber-400" />
                  <span>{myReview ? 'Edit Your Review' : 'Write a Customer Review'}</span>
                </button>
              </div>

              {/* Rating Summary Dashboard & Distribution Chart */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-3xl bg-zinc-50/80 border border-zinc-200/80">
                {/* Left: Overall Score (5 Cols) */}
                <div className="md:col-span-5 flex flex-col justify-center space-y-3 border-b md:border-b-0 md:border-r border-zinc-200/80 pb-6 md:pb-0 md:pr-6">
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-black text-zinc-950 tracking-tight font-mono">
                      {(reviewSummary?.averageRating || rating || 0).toFixed(1)}
                    </span>
                    <span className="text-sm font-semibold text-zinc-400">
                      out of 5.0
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`w-5 h-5 ${
                          starIdx <= Math.round(reviewSummary?.averageRating || rating || 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-200'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="space-y-1 text-xs text-zinc-500 font-medium">
                    <div>Based on <strong>{reviewSummary?.totalReviews || reviewCount || 0}</strong> verified customer reviews</div>
                    <div className="flex items-center gap-2 pt-1">
                      {reviewSummary && reviewSummary.withPhotosCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-[10px] font-bold text-zinc-700 shadow-2xs">
                          <Camera className="w-3 h-3 text-indigo-600" />
                          <span>{reviewSummary.withPhotosCount} with photos</span>
                        </span>
                      )}
                      {reviewSummary && reviewSummary.verifiedCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800 shadow-2xs">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>{reviewSummary.verifiedCount} verified</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Star Distribution Bar Chart (7 Cols) */}
                <div className="md:col-span-7 space-y-2">
                  <div className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                    Rating Breakdown
                  </div>
                  {[5, 4, 3, 2, 1].map((starNum) => {
                    const count = reviewSummary?.distribution?.[starNum as keyof typeof reviewSummary.distribution] || 0;
                    const percent = reviewSummary?.distributionPercentages?.[starNum as keyof typeof reviewSummary.distributionPercentages] || 0;
                    const isSelected = reviewRatingFilter === starNum;

                    return (
                      <button
                        key={starNum}
                        type="button"
                        onClick={() =>
                          setReviewRatingFilter(isSelected ? null : starNum)
                        }
                        className={`w-full flex items-center gap-3 p-1.5 rounded-xl transition-all text-xs text-left cursor-pointer group ${
                          isSelected
                            ? 'bg-amber-100/70 ring-1 ring-amber-400'
                            : 'hover:bg-zinc-100/80'
                        }`}
                      >
                        <span className="w-12 font-bold text-zinc-700 flex items-center gap-1 shrink-0">
                          <span>{starNum}</span>
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        </span>

                        <div className="flex-1 h-3 rounded-full bg-zinc-200 overflow-hidden relative">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <span className="w-16 text-right font-mono text-[11px] text-zinc-500 group-hover:text-zinc-950 shrink-0 font-medium">
                          {percent}% ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter & Sort Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {/* Filter Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewRatingFilter(null);
                      setReviewWithPhotosFilter(false);
                      setReviewVerifiedOnlyFilter(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                      !reviewRatingFilter && !reviewWithPhotosFilter && !reviewVerifiedOnlyFilter
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    All Reviews
                  </button>

                  {[5, 4, 3, 2, 1].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRatingFilter(reviewRatingFilter === s ? null : s)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1 ${
                        reviewRatingFilter === s
                          ? 'bg-amber-400 text-zinc-950 border-amber-400 font-extrabold'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      <span>{s}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setReviewWithPhotosFilter(!reviewWithPhotosFilter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                      reviewWithPhotosFilter
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>With Photos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewVerifiedOnlyFilter(!reviewVerifiedOnlyFilter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                      reviewVerifiedOnlyFilter
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Only</span>
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-400">Sort by:</span>
                  <select
                    value={reviewSort}
                    onChange={(e) => setReviewSort(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-950 cursor-pointer"
                  >
                    <option value="newest">Most Recent</option>
                    <option value="highest_rating">Highest Rating</option>
                    <option value="lowest_rating">Lowest Rating</option>
                    <option value="most_helpful">Most Helpful</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviewsLoading ? (
                  <div className="space-y-4 py-8">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="p-6 rounded-3xl bg-zinc-50 border border-zinc-200 animate-pulse space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-200" />
                          <div className="space-y-1.5">
                            <div className="w-28 h-3.5 bg-zinc-200 rounded-md" />
                            <div className="w-20 h-3 bg-zinc-200 rounded-md" />
                          </div>
                        </div>
                        <div className="w-48 h-4 bg-zinc-200 rounded-md" />
                        <div className="w-full h-12 bg-zinc-200 rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-zinc-50 border border-zinc-200/80 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 shadow-2xs flex items-center justify-center mx-auto text-amber-500">
                      <Star className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-zinc-950">
                        {reviewRatingFilter || reviewWithPhotosFilter || reviewVerifiedOnlyFilter
                          ? 'No reviews match your selected filters'
                          : 'No Customer Reviews Yet'}
                      </h4>
                      <p className="text-xs text-zinc-500 max-w-md mx-auto">
                        {reviewRatingFilter || reviewWithPhotosFilter || reviewVerifiedOnlyFilter
                          ? 'Try clearing some filters to see all available customer feedback.'
                          : 'Be the first verified customer to purchase this product and share your thoughts with the community.'}
                      </p>
                    </div>
                    {(reviewRatingFilter || reviewWithPhotosFilter || reviewVerifiedOnlyFilter) && (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewRatingFilter(null);
                          setReviewWithPhotosFilter(false);
                          setReviewVerifiedOnlyFilter(false);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-100 transition-colors shadow-2xs cursor-pointer"
                      >
                        Clear Active Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((rev) => (
                      <ReviewCard
                        key={rev._id}
                        review={rev}
                        onEdit={() => {
                          setIsWriteReviewModalOpen(true);
                        }}
                        onDeleted={(deletedId: any) => {
                          setReviews((prev) => prev.filter((r) => r._id !== deletedId));
                          if (id) {
                            fetchReviews(id);
                            fetchProductData(id, true);
                          }
                        }}
                        onReviewUpdated={(updated: any) => {
                          setReviews((prev) =>
                            prev.map((r) => (r._id === updated._id ? updated : r))
                          );
                        }}
                        isMerchantOwner={
                          Boolean(user && (user._id === product.companyId || user.role === 'admin'))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-bold text-zinc-950">Shipping, Warranty & Return Policies</h3>
              <div className="space-y-4 text-xs text-zinc-600 leading-relaxed">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                  <Truck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-900 block mb-1">Standard & Express Delivery</strong>
                    Orders placed before 2:00 PM are processed same-day. Free standard ground shipping on orders above $50.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                  <RotateCcw className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-900 block mb-1">30-Day Hassle-Free Returns</strong>
                    Return this item in its original condition for a full refund within 30 days of receipt.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-900 block mb-1">1-Year Manufacturer Warranty</strong>
                    Protected against manufacturing defects with full service and replacement coverage.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Related Products Carousel / Grid */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-zinc-950">
                  Customers Also Viewed
                </h3>
                <p className="text-xs text-zinc-500">Similar items in {product.category}</p>
              </div>
              <Link
                to={`/?category=${product.category}`}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
              >
                View category <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => {
                const relCartItem = items.find((i) => i.productId === rel._id);
                return (
                  <div
                    key={rel._id}
                    onClick={() => navigate(`/product/${rel._id}`)}
                    className="group bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-2xs hover:shadow-lg hover:border-zinc-300 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-square rounded-xl bg-zinc-100 overflow-hidden">
                        <img
                          src={rel.image}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-300"
                          loading="lazy"
                        />
                        {relCartItem && (
                          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-zinc-950 text-white text-[10px] font-black tracking-wider shadow-md animate-in zoom-in-75">
                            {relCartItem.quantity} in cart
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                          {rel.category}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-900 line-clamp-2 mt-0.5 group-hover:text-indigo-600 transition-colors">
                          {rel.title}
                        </h4>
                      </div>
                    </div>
                    <div className="pt-3 flex items-center justify-between border-t border-zinc-100 mt-3">
                      <span className="text-sm font-extrabold text-zinc-950">
                        ${rel.price.toFixed(2)}
                      </span>
                      {relCartItem ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center rounded-lg bg-zinc-950 text-white p-0.5 shadow-xs border border-zinc-900"
                        >
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (relCartItem.quantity <= 1) {
                                await removeFromCart(rel._id);
                              } else {
                                await updateQuantity(rel._id, relCartItem.quantity - 1);
                              }
                            }}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
                            title={relCartItem.quantity === 1 ? 'Remove from cart' : 'Decrease'}
                          >
                            {relCartItem.quantity === 1 ? (
                              <Trash2 className="w-3 h-3 text-rose-400" />
                            ) : (
                              <Minus className="w-3 h-3" />
                            )}
                          </button>
                          <span className="px-2 text-xs font-black font-mono text-white min-w-[18px] text-center select-none">
                            {relCartItem.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={
                              actionLoading ||
                              Boolean(rel.stock !== undefined && relCartItem.quantity >= rel.stock)
                            }
                            onClick={async (e) => {
                              e.stopPropagation();
                              await updateQuantity(rel._id, relCartItem.quantity + 1);
                            }}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
                            title="Increase"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={rel.stock === 0}
                          onClick={async (e) => {
                            e.stopPropagation();
                            await addToCart(
                              {
                                productId: rel._id,
                                title: rel.title,
                                price: rel.price,
                                image: rel.image,
                                category: rel.category,
                                companyId: rel.companyId,
                                companyName: rel.companyName,
                                stock: rel.stock,
                                quantity: 1,
                              },
                              false
                            );
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-zinc-950 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Customer Review Creation / Edit Modal */}
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
