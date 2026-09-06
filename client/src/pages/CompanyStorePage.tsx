import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  Star,
  Package,
  Search,
  ArrowUpDown,
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
  Megaphone,
  Ticket,
} from 'lucide-react';
import { getCompanyStorefrontApi } from '../services/productService';
import { getAvailableCouponsApi } from '../services/couponService';
import { ProductCard } from '../components/ProductCard';
import type { Product, CompanyStorefrontResponse } from '../types/product';
import type { Coupon } from '../types/coupon';

export const CompanyStorePage: React.FC = () => {
  const { companyIdentifier } = useParams<{ companyIdentifier: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [storeData, setStoreData] = useState<CompanyStorefrontResponse['store'] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [storeCoupons, setStoreCoupons] = useState<Coupon[]>([]);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Flash Sale Countdown State
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

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

      // Fetch active store coupons
      if (data.store?.companyId) {
        try {
          const couponRes = await getAvailableCouponsApi({ companyId: data.store.companyId });
          if (couponRes.success && couponRes.coupons) {
            setStoreCoupons(couponRes.coupons);
          }
        } catch {
          // Non-blocking
        }
      }
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
      <div className="bg-white border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              {/* Store Avatar */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-2xs shrink-0">
                <Store className="w-7 h-7 sm:w-8 sm:h-8 text-zinc-700" />
              </div>

              {/* Store Titles & Info */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified Merchant
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-50 text-zinc-500 border border-zinc-200">
                    {storeData?.tagline || 'Official Storefront'}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
                  {companyName}
                </h1>

                <p className="text-xs text-zinc-500 max-w-xl line-clamp-2">
                  {storeData?.description ||
                    `Browse authentic products and verified inventory fulfilled directly by ${companyName}.`}
                </p>
              </div>
            </div>

            {/* Merchant Metrics Card */}
            {storeData && (
              <div className="flex items-center gap-3 sm:gap-4 bg-zinc-50/70 p-3.5 rounded-2xl border border-zinc-200/60 self-start md:self-auto">
                <div className="text-center px-2 sm:px-3">
                  <div className="text-base sm:text-lg font-bold text-zinc-950">
                    {storeData.totalProducts}
                  </div>
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Listed Items
                  </div>
                </div>

                <div className="h-7 w-px bg-zinc-200" />

                <div className="text-center px-2 sm:px-3">
                  <div className="text-base sm:text-lg font-bold text-zinc-950 flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{storeData.numReviews > 0 && storeData.rating > 0 ? storeData.rating.toFixed(1) : '0.0'}</span>
                  </div>
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    {storeData.numReviews > 0 ? `${storeData.numReviews} Reviews` : 'No reviews'}
                  </div>
                </div>

                <div className="h-7 w-px bg-zinc-200" />

                <div className="text-center px-2 sm:px-3">
                  <div className="text-base sm:text-lg font-bold text-zinc-950">
                    {storeData.categories.length}
                  </div>
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Categories
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Trust Highlights */}
          <div className="mt-6 pt-5 border-t border-zinc-100 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-zinc-700 shrink-0" />
              <span className="text-[11px] sm:text-xs">Direct Merchant Dispatch</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-zinc-700 shrink-0" />
              <span className="text-[11px] sm:text-xs">100% Authentic Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-zinc-700 shrink-0" />
              <span className="text-[11px] sm:text-xs">30-Day Returns</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-700 shrink-0" />
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
              <div className="rounded-2xl bg-zinc-950 text-white p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-200 text-xs font-semibold">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>Limited Store Promotion</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
                      {storeData.flashSale.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
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

            {/* Active Store Coupons & Discounts Ribbon */}
            {storeCoupons.length > 0 && (
              <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-950">
                    <Ticket className="w-4 h-4 text-emerald-600" />
                    <span>Store Coupons & Promo Deals</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {storeCoupons.length} Active {storeCoupons.length === 1 ? 'Voucher' : 'Vouchers'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {storeCoupons.map((cp) => (
                    <div
                      key={cp._id || cp.code}
                      className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col justify-between space-y-2 hover:bg-emerald-50/80 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-zinc-950 text-white shadow-2xs">
                          {cp.code}
                        </span>
                        <span className="text-xs font-black text-emerald-800">
                          {cp.discountType === 'percentage'
                            ? `${cp.discountValue}% OFF`
                            : `$${cp.discountValue.toFixed(2)} OFF`}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 line-clamp-1">
                        {cp.description}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-emerald-100 text-[10px]">
                        <span className="text-zinc-500 font-mono">
                          {cp.minPurchaseAmount > 0
                            ? `Min $${cp.minPurchaseAmount.toFixed(2)}`
                            : 'No minimum'}
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
              <div className="py-16 text-center bg-white rounded-2xl border border-zinc-200/80 p-8 space-y-4 max-w-md mx-auto my-6 shadow-xs">
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
                {products.map((product, idx) => (
                  <ProductCard key={product._id} product={product} index={idx} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
