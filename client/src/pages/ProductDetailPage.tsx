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
} from 'lucide-react';
import { getProductByIdApi, getProductsApi } from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import type { Product } from '../types/product';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, items, updateQuantity, removeFromCart, openBusinessModal, actionLoading } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews' | 'shipping'>('details');

  const fetchProductData = useCallback(async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProductByIdApi(productId);
      if (data.product) {
        setProduct(data.product);
        setQuantity(1);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchProductData(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [id, fetchProductData]);

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0) return;
    if (user?.role === 'company') {
      openBusinessModal({ actionTitle: 'Add to Cart', productTitle: product.title });
      return;
    }
    setAddingToCart(true);
    try {
      await addToCart({
        productId: product._id,
        title: product.title,
        price: product.price,
        image: product.image,
        category: product.category,
        companyId: product.companyId,
        companyName: product.companyName,
        stock: product.stock,
        quantity,
      });
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
      await addToCart(
        {
          productId: product._id,
          title: product.title,
          price: product.price,
          image: product.image,
          category: product.category,
          companyId: product.companyId,
          companyName: product.companyName,
          stock: product.stock,
          quantity,
        },
        true
      );
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
            <div className="relative aspect-square rounded-3xl bg-white border border-zinc-200 p-4 shadow-sm overflow-hidden group">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                {product.category}
              </span>
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

            {/* Feature Thumbnails Banner */}
            <div className="grid grid-cols-4 gap-3">
              <div className="aspect-square rounded-xl border-2 border-zinc-950 p-1 bg-white overflow-hidden shadow-xs cursor-pointer">
                <img src={product.image} alt="Thumbnail 1" className="w-full h-full object-contain" />
              </div>
              <div className="aspect-square rounded-xl border border-zinc-200 p-2 bg-zinc-50 flex flex-col items-center justify-center text-center text-[10px] text-zinc-500 font-medium">
                <ShieldCheck className="w-5 h-5 text-indigo-600 mb-0.5" />
                <span>100% Genuine</span>
              </div>
              <div className="aspect-square rounded-xl border border-zinc-200 p-2 bg-zinc-50 flex flex-col items-center justify-center text-center text-[10px] text-zinc-500 font-medium">
                <Truck className="w-5 h-5 text-emerald-600 mb-0.5" />
                <span>Fast Transit</span>
              </div>
              <div className="aspect-square rounded-xl border border-zinc-200 p-2 bg-zinc-50 flex flex-col items-center justify-center text-center text-[10px] text-zinc-500 font-medium">
                <RotateCcw className="w-5 h-5 text-amber-600 mb-0.5" />
                <span>30-Day Return</span>
              </div>
            </div>
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

              {/* Quantity selector */}
              {product.stock > 0 && (() => {
                const cartItem = items.find((i) => i.productId === product._id);
                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider">
                        Quantity
                      </label>
                      {cartItem && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{cartItem.quantity} in your cart</span>
                        </span>
                      )}
                    </div>

                    {cartItem ? (
                      <div className="flex items-center border border-zinc-900 rounded-xl bg-zinc-950 p-1 w-full justify-between shadow-xs animate-in zoom-in-95">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={async () => {
                            if (cartItem.quantity <= 1) {
                              await removeFromCart(product._id);
                            } else {
                              await updateQuantity(product._id, cartItem.quantity - 1);
                            }
                          }}
                          className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold flex items-center justify-center disabled:opacity-40 cursor-pointer transition-colors"
                          title={cartItem.quantity === 1 ? 'Remove from cart' : 'Decrease quantity'}
                        >
                          {cartItem.quantity === 1 ? (
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="text-sm font-black font-mono text-white px-3">
                          {cartItem.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={
                            actionLoading ||
                            Boolean(product.stock !== undefined && cartItem.quantity >= product.stock)
                          }
                          onClick={async () => {
                            await updateQuantity(product._id, cartItem.quantity + 1);
                          }}
                          className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold flex items-center justify-center disabled:opacity-40 cursor-pointer transition-colors"
                          title="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center border border-zinc-200 rounded-xl bg-zinc-50 p-1 w-full justify-between">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={quantity <= 1}
                          className="w-8 h-8 rounded-lg bg-white border border-zinc-200 text-zinc-700 font-bold flex items-center justify-center hover:bg-zinc-100 disabled:opacity-40 cursor-pointer shadow-2xs"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold text-zinc-900 px-3">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                          disabled={quantity >= product.stock}
                          className="w-8 h-8 rounded-lg bg-white border border-zinc-200 text-zinc-700 font-bold flex items-center justify-center hover:bg-zinc-100 disabled:opacity-40 cursor-pointer shadow-2xs"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

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
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {addingToCart
                    ? 'Adding to Cart...'
                    : items.find((i) => i.productId === product._id)
                    ? 'Add More to Cart'
                    : 'Add to Cart'}
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0 || buyingNow}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {buyingNow ? 'Processing...' : 'Buy Now'}
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
            <div className="max-w-2xl">
              <h3 className="text-lg font-bold text-zinc-950 mb-4">Technical Details</h3>
              <div className="border border-zinc-200 rounded-2xl overflow-hidden divide-y divide-zinc-200 text-xs">
                <div className="grid grid-cols-3 p-3.5 bg-zinc-50 font-medium">
                  <span className="text-zinc-500">Product Model ID</span>
                  <span className="col-span-2 text-zinc-900 font-mono">{product._id}</span>
                </div>
                <div className="grid grid-cols-3 p-3.5 font-medium">
                  <span className="text-zinc-500">Merchant Entity ID</span>
                  <span className="col-span-2 text-zinc-900 font-mono">{product.companyId}</span>
                </div>
                <div className="grid grid-cols-3 p-3.5 bg-zinc-50 font-medium">
                  <span className="text-zinc-500">Category Tag</span>
                  <span className="col-span-2 text-zinc-900 capitalize">{product.category}</span>
                </div>
                <div className="grid grid-cols-3 p-3.5 font-medium">
                  <span className="text-zinc-500">Inventory Status</span>
                  <span className="col-span-2 text-emerald-700 font-bold">{product.stock} Units Ready to Ship</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div id="reviews" className="space-y-6 max-w-3xl">
              <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-950">Customer Reviews</h3>
                  <p className="text-xs text-zinc-500">Verified buyer ratings and feedback</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-zinc-900">
                    {rating > 0 ? `${rating.toFixed(1)} / 5.0` : '0.0 / 5.0'}
                  </span>
                </div>
              </div>

              {reviewCount === 0 ? (
                <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 shadow-2xs flex items-center justify-center mx-auto text-amber-500">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-950">No Customer Reviews Yet</h4>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                      Be the first verified customer to purchase and leave feedback for this product.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                  <span className="text-xs font-bold text-zinc-900">{reviewCount} Verified Ratings</span>
                  <p className="text-xs text-zinc-600">Average customer rating is {rating.toFixed(1)} out of 5 stars.</p>
                </div>
              )}
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
    </div>
  );
};
