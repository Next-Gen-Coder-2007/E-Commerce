import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Star,
  Package,
  Search,
  ArrowUpDown,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Share2,
  Check,
  ArrowLeft,
  Store,
  Flame,
  Clock,
  Zap,
  Megaphone,
} from 'lucide-react';
import { getCompanyStorefrontApi } from '../services/productService';
import { useCart } from '../context/CartContext';
import type { Product, CompanyStorefrontResponse } from '../types/product';

export const CompanyStorePage: React.FC = () => {
  const { companyIdentifier } = useParams<{ companyIdentifier: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [storeData, setStoreData] = useState<CompanyStorefrontResponse['store'] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Flash Sale Countdown State
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const { addToCart, items, updateQuantity, removeFromCart, actionLoading } = useCart();

  const fetchStorefront = useCallback(async () => {
    if (!companyIdentifier) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCompanyStorefrontApi(companyIdentifier, {
        category: activeCategory !== 'all' ? activeCategory : undefined,
        sort: sort as any,
        search: search.trim() || undefined,
        limit: 48,
      });

      setStoreData(data.store);
      setProducts(data.products || []);
      setTotalCount(data.total || 0);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load merchant store.'
      );
    } finally {
      setLoading(false);
    }
  }, [companyIdentifier, activeCategory, sort, search]);

  useEffect(() => {
    fetchStorefront();
  }, [fetchStorefront]);

  // Keep search input synced with url
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Countdown timer calculation
  useEffect(() => {
    if (!storeData?.flashSale?.isActive || !storeData.flashSale.endsAt) {
      setTimeLeft(null);
      return;
    }

    const calculateTime = () => {
      const difference = new Date(storeData.flashSale!.endsAt!).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [storeData?.flashSale]);

  const handleCategorySelect = (cat: string) => {
    const params = new URLSearchParams(searchParams);
    if (cat === 'all') {
      params.delete('category');
    } else {
      params.set('category', cat);
    }
    params.delete('page');
    setSearchParams(params);
  };

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams);
    if (newSort === 'newest') {
      params.delete('sort');
    } else {
      params.set('sort', newSort);
    }
    setSearchParams(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      params.set('search', searchInput.trim());
    } else {
      params.delete('search');
    }
    params.delete('page');
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const handleShareStore = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  };

  const companyName = storeData?.companyName || decodeURIComponent(companyIdentifier || 'Merchant Store');

  return (
    <div className="min-h-screen bg-zinc-50/60 text-zinc-900 flex flex-col font-sans pb-20">
      {/* Optional Merchant Announcement Ribbon */}
      {storeData?.announcement && (
        <div className="bg-amber-400 text-zinc-950 text-xs font-black py-2 px-4 text-center shadow-xs flex items-center justify-center gap-2 animate-in fade-in">
          <Megaphone className="w-3.5 h-3.5" />
          <span>{storeData.announcement}</span>
        </div>
      )}

      {/* Breadcrumb Navigation Bar */}
      <div className="bg-white border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs text-zinc-500">
          <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
            <Link to="/" className="hover:text-zinc-900 transition-colors">
              Marketplace
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-zinc-600">Stores</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="font-bold text-zinc-900 truncate max-w-[200px] sm:max-w-xs">
              {companyName}
            </span>
          </nav>

          <button
            type="button"
            onClick={handleShareStore}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold transition-colors cursor-pointer shrink-0"
            title="Share Storefront"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share Store</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Merchant Hero Banner */}
      <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950 text-white relative overflow-hidden border-b border-zinc-800">
        {/* Custom Background Banner or Radial Pattern */}
        {storeData?.bannerImage ? (
          <img
            src={storeData.bannerImage}
            alt={`${companyName} Banner`}
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              {/* Store Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl shrink-0">
                <Store className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
              </div>

              {/* Store Titles & Info */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Merchant
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-zinc-300 border border-white/10">
                    {storeData?.tagline || 'Official Brand Storefront'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                  {companyName}
                </h1>

                <p className="text-xs sm:text-sm text-zinc-300 max-w-xl line-clamp-2">
                  {storeData?.description ||
                    `Browse authentic products, exclusive brand collections, and verified inventory directly fulfilled by ${companyName}.`}
                </p>
              </div>
            </div>

            {/* Merchant Metrics Card */}
            {storeData && (
              <div className="flex items-center gap-3 sm:gap-4 bg-white/5 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/10 self-start md:self-auto">
                <div className="text-center px-2 sm:px-3">
                  <div className="text-lg sm:text-2xl font-black text-white">
                    {storeData.totalProducts}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Listed Items
                  </div>
                </div>

                <div className="h-8 w-px bg-white/15" />

                <div className="text-center px-2 sm:px-3">
                  <div className="text-lg sm:text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400" />
                    <span>{storeData.rating > 0 ? storeData.rating.toFixed(1) : '5.0'}</span>
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Seller Rating
                  </div>
                </div>

                <div className="h-8 w-px bg-white/15" />

                <div className="text-center px-2 sm:px-3">
                  <div className="text-lg sm:text-2xl font-black text-white">
                    {storeData.categories.length}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Categories
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Trust Highlights */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[11px] sm:text-xs">Direct Merchant Dispatch</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] sm:text-xs">100% Authentic Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-[11px] sm:text-xs">30-Day Buyer Protection</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[11px] sm:text-xs">Verified Top Merchant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-1 w-full space-y-8">
        {error && (
          <div className="p-6 my-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
            <h3 className="text-sm font-bold text-rose-900">{error}</h3>
            <p className="text-xs text-rose-700">
              The merchant store you are looking for may have no published products or does not exist.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Marketplace</span>
            </Link>
          </div>
        )}

        {!error && (
          <>
            {/* Active Flash Sale Showcase Banner */}
            {storeData?.flashSale?.isActive && (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-rose-600 to-indigo-700 text-white p-6 sm:p-8 shadow-xl animate-in zoom-in-95 duration-200">
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md text-amber-300 text-xs font-black uppercase tracking-wider border border-white/10">
                      <Flame className="w-4 h-4 fill-amber-300 animate-bounce" />
                      <span>Exclusive Store Flash Sale</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                      {storeData.flashSale.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                      {storeData.flashSale.description ||
                        `Special limited-time promotions up to ${storeData.flashSale.discountPercentage}% OFF on verified collections.`}
                    </p>
                  </div>

                  {/* Countdown Clock */}
                  {timeLeft && (
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-200">
                        <Clock className="w-4 h-4" />
                        <span>Flash Deals Expire In</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-black/40 backdrop-blur-md border border-white/20 px-3 py-2 rounded-2xl text-center min-w-[52px]">
                          <div className="text-xl sm:text-2xl font-black font-mono leading-none">
                            {String(timeLeft.days).padStart(2, '0')}
                          </div>
                          <div className="text-[9px] font-bold uppercase tracking-wider text-white/70 mt-1">
                            Days
                          </div>
                        </div>
                        <span className="text-xl font-bold">:</span>
                        <div className="bg-black/40 backdrop-blur-md border border-white/20 px-3 py-2 rounded-2xl text-center min-w-[52px]">
                          <div className="text-xl sm:text-2xl font-black font-mono leading-none">
                            {String(timeLeft.hours).padStart(2, '0')}
                          </div>
                          <div className="text-[9px] font-bold uppercase tracking-wider text-white/70 mt-1">
                            Hours
                          </div>
                        </div>
                        <span className="text-xl font-bold">:</span>
                        <div className="bg-black/40 backdrop-blur-md border border-white/20 px-3 py-2 rounded-2xl text-center min-w-[52px]">
                          <div className="text-xl sm:text-2xl font-black font-mono leading-none">
                            {String(timeLeft.minutes).padStart(2, '0')}
                          </div>
                          <div className="text-[9px] font-bold uppercase tracking-wider text-white/70 mt-1">
                            Mins
                          </div>
                        </div>
                        <span className="text-xl font-bold">:</span>
                        <div className="bg-black/40 backdrop-blur-md border border-white/20 px-3 py-2 rounded-2xl text-center min-w-[52px]">
                          <div className="text-xl sm:text-2xl font-black font-mono leading-none">
                            {String(timeLeft.seconds).padStart(2, '0')}
                          </div>
                          <div className="text-[9px] font-bold uppercase tracking-wider text-white/70 mt-1">
                            Secs
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Filter & Search Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80">
              {/* In-Store Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={`Search in ${companyName}'s store...`}
                  className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all shadow-2xs"
                />
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Search
                </button>
              </form>

              {/* Sort selector */}
              <div className="flex items-center gap-3 self-end md:self-auto">
                <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">
                  {totalCount} {totalCount === 1 ? 'product' : 'products'} available
                </span>

                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="appearance-none pl-8 pr-8 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-800 shadow-2xs focus:outline-none focus:border-zinc-950 cursor-pointer"
                  >
                    <option value="newest">Sort: Newest Arrivals</option>
                    <option value="price_asc">Sort: Price (Low to High)</option>
                    <option value="price_desc">Sort: Price (High to Low)</option>
                    <option value="rating">Sort: Top Customer Rated</option>
                  </select>
                  <ArrowUpDown className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Merchant Category Filter Pills */}
            {storeData && storeData.categories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => handleCategorySelect('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === 'all'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
                  }`}
                >
                  All Store Products ({storeData.totalProducts})
                </button>

                {storeData.categories.map((cat) => {
                  const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-zinc-950 text-white shadow-xs'
                          : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Active filters notice */}
            {(search || activeCategory !== 'all') && (
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <span className="font-semibold">Filtering by:</span>
                {search && (
                  <span className="px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-800 font-medium">
                    Search: &ldquo;{search}&rdquo;
                  </span>
                )}
                {activeCategory !== 'all' && (
                  <span className="px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-800 font-medium capitalize">
                    Category: {activeCategory}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-rose-600 hover:underline font-bold ml-2 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Product Grid / Loading / Empty State */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-zinc-200/80 p-4 space-y-3 animate-pulse"
                  >
                    <div className="w-full aspect-square bg-zinc-100 rounded-xl" />
                    <div className="h-4 bg-zinc-100 rounded-md w-3/4" />
                    <div className="h-3 bg-zinc-100 rounded-md w-1/2" />
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-5 bg-zinc-100 rounded-md w-16" />
                      <div className="h-8 bg-zinc-100 rounded-lg w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-3xl border border-zinc-200/80 p-8 space-y-4 max-w-md mx-auto my-6 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-zinc-950">
                  No products found in this store
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  No matching products were found for the selected category or search term in {companyName}&apos;s catalog.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  Reset Store Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
                {products.map((product) => {
                  const cartItem = items.find((i) => i.productId === product._id);
                  const hasDiscount =
                    (product.originalPrice && product.originalPrice > product.price) ||
                    (product.discountPercentage && product.discountPercentage > 0);

                  const discountPct =
                    product.discountPercentage ||
                    (product.originalPrice && product.originalPrice > product.price
                      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                      : 0);

                  return (
                    <div
                      key={product._id}
                      onClick={() => navigate(`/product/${product._id}`)}
                      className="group bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-2xs hover:shadow-lg hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                    >
                      <div className="space-y-3">
                        <div className="relative aspect-square rounded-xl bg-zinc-100 overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-300"
                            loading="lazy"
                          />
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider text-zinc-800 shadow-2xs">
                            {product.category}
                          </span>
                          
                          {/* Discount Badge */}
                          {hasDiscount && (
                            <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black tracking-wider shadow-md">
                              -{discountPct}% OFF
                            </span>
                          )}

                          {/* Flash Sale Tag */}
                          {product.isFlashSale && (
                            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider shadow-md flex items-center gap-0.5">
                              <Zap className="w-3 h-3 fill-white" />
                              <span>Flash Deal</span>
                            </span>
                          )}

                          {cartItem && !product.isFlashSale && (
                            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-zinc-950 text-white text-[10px] font-black tracking-wider shadow-md animate-in zoom-in-75">
                              {cartItem.quantity} in cart
                            </span>
                          )}
                          {product.stock <= 5 && product.stock > 0 && (
                            <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-amber-500/90 text-white text-[10px] font-bold shadow-2xs">
                              Only {product.stock} left
                            </span>
                          )}
                          {product.stock === 0 && (
                            <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-rose-600/90 text-white text-[10px] font-bold shadow-2xs">
                              Out of stock
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1 text-zinc-400 text-[11px] mb-1">
                            <Building2 className="w-3 h-3 text-zinc-500" />
                            <span className="truncate font-medium text-zinc-600">
                              {product.companyName}
                            </span>
                          </div>

                          <h2 className="text-sm font-bold text-zinc-900 group-hover:text-zinc-700 transition-colors line-clamp-2 leading-snug">
                            {product.title}
                          </h2>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-extrabold text-zinc-950">
                              ${product.price.toFixed(2)}
                            </span>
                            {hasDiscount && product.originalPrice ? (
                              <span className="text-xs text-zinc-400 line-through">
                                ${product.originalPrice.toFixed(2)}
                              </span>
                            ) : null}
                          </div>
                          {product.numReviews && product.numReviews > 0 ? (
                            <div className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
                              <span className="text-zinc-400">({product.numReviews})</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-zinc-400 font-medium pt-0.5">
                              New Listing
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/product/${product._id}`);
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Details
                          </button>

                          {cartItem ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center rounded-lg bg-zinc-950 text-white p-0.5 shadow-xs border border-zinc-900 animate-in zoom-in-90 duration-150"
                            >
                              <button
                                type="button"
                                disabled={actionLoading || addingId === product._id}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setAddingId(product._id);
                                  if (cartItem.quantity <= 1) {
                                    await removeFromCart(product._id);
                                  } else {
                                    await updateQuantity(product._id, cartItem.quantity - 1);
                                  }
                                  setAddingId(null);
                                }}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors cursor-pointer"
                                title={cartItem.quantity === 1 ? 'Remove from cart' : 'Decrease quantity'}
                              >
                                {cartItem.quantity === 1 ? (
                                  <Trash2 className="w-3 h-3 text-rose-400" />
                                ) : (
                                  <Minus className="w-3 h-3" />
                                )}
                              </button>
                              <span className="px-2 text-xs font-black font-mono text-white min-w-[20px] text-center select-none">
                                {cartItem.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={
                                  actionLoading ||
                                  addingId === product._id ||
                                  (product.stock !== undefined && cartItem.quantity >= product.stock)
                                }
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setAddingId(product._id);
                                  await updateQuantity(product._id, cartItem.quantity + 1);
                                  setAddingId(null);
                                }}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors cursor-pointer"
                                title="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={product.stock === 0 || addingId === product._id}
                              onClick={async (e) => {
                                e.stopPropagation();
                                setAddingId(product._id);
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
                                    quantity: 1,
                                  },
                                  false
                                );
                                setAddingId(null);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 rounded-lg transition-all active:scale-95 shadow-2xs cursor-pointer"
                              title="Quick Add to Cart"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
