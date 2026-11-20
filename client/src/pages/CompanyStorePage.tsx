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
import { BrutalistButton } from '../components/BrutalistButton';

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
    <div className="min-h-screen bg-[#E4E2DD] text-[#1E1E1E] flex flex-col pb-24">
      {/* Optional Merchant Announcement Ribbon */}
      {storeData?.announcement && (
        <div className="bg-[#F8A348] text-[#1E1E1E] text-xs font-mono font-bold py-2.5 px-4 text-center border-b-2 border-[#1E1E1E] flex items-center justify-center gap-2">
          <Megaphone className="w-4 h-4" />
          <span className="uppercase tracking-wider">{storeData.announcement}</span>
        </div>
      )}

      {/* Breadcrumb Navigation Bar */}
      <div className="bg-[#D9D6D0] border-b-2 border-[#1E1E1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs font-mono">
          <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap uppercase">
            <Link to="/" className="text-[#444444] hover:text-[#1E1E1E] font-bold transition-colors">
              Marketplace
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#1E1E1E] shrink-0" />
            <span className="text-[#444444]">Stores</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#1E1E1E] shrink-0" />
            <span className="font-bold text-[#DB4A2B] truncate max-w-[200px] sm:max-w-xs">
              {companyName}
            </span>
          </nav>

          <button
            type="button"
            onClick={handleShareStore}
            className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#1E1E1E] bg-white hover:bg-[#1E1E1E] hover:text-[#E4E2DD] text-xs font-mono font-bold uppercase transition-colors cursor-pointer shrink-0"
            title="Share Storefront"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#DB4A2B]" />
                <span className="text-[#DB4A2B]">URL Copied</span>
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
      <div className="bg-white border-b-2 border-[#1E1E1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-start sm:items-center gap-5 sm:gap-6">
              {/* Store Avatar */}
              <div className="w-20 h-20 border-2 border-[#1E1E1E] bg-[#E4E2DD] flex items-center justify-center text-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] shrink-0">
                <Store className="w-10 h-10 text-[#1E1E1E]" />
              </div>

              {/* Store Titles & Info */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-[#1E1E1E] text-[#E4E2DD] inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#FF89A9]" />
                    VERIFIED MERCHANT STORE
                  </span>
                  <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase bg-[#D9D6D0] text-[#1E1E1E] border border-[#1E1E1E]">
                    {storeData?.tagline || 'OFFICIAL CATALOG'}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-clash font-bold tracking-tight text-[#1E1E1E] uppercase">
                  {companyName}
                </h1>

                <p className="text-xs font-satoshi text-[#444444] max-w-xl line-clamp-2 leading-relaxed">
                  {storeData?.description ||
                    `Explore verified authentic product inventory dispatched and guaranteed directly by ${companyName}.`}
                </p>
              </div>
            </div>

            {/* Merchant Metrics Card */}
            {storeData && (
              <div className="flex items-center gap-4 bg-[#E4E2DD] p-4 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] self-start md:self-auto">
                <div className="text-center px-3">
                  <div className="text-xl font-clash font-bold text-[#1E1E1E]">
                    {storeData.totalProducts}
                  </div>
                  <div className="text-[9px] font-mono font-bold text-[#444444] uppercase tracking-wider">
                    Listed Items
                  </div>
                </div>

                <div className="h-8 w-0.5 bg-[#1E1E1E]" />

                <div className="text-center px-3">
                  <div className="text-xl font-clash font-bold text-[#1E1E1E] flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 fill-[#DB4A2B] text-[#DB4A2B]" />
                    <span>{storeData.numReviews > 0 && storeData.rating > 0 ? storeData.rating.toFixed(1) : '0.0'}</span>
                  </div>
                  <div className="text-[9px] font-mono font-bold text-[#444444] uppercase tracking-wider">
                    {storeData.numReviews > 0 ? `${storeData.numReviews} Reviews` : '0 Reviews'}
                  </div>
                </div>

                <div className="h-8 w-0.5 bg-[#1E1E1E]" />

                <div className="text-center px-3">
                  <div className="text-xl font-clash font-bold text-[#1E1E1E]">
                    {storeData.categories.length}
                  </div>
                  <div className="text-[9px] font-mono font-bold text-[#444444] uppercase tracking-wider">
                    Categories
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Trust Highlights */}
          <div className="mt-8 pt-6 border-t-2 border-[#1E1E1E] grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono uppercase text-[#1E1E1E]">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#DB4A2B] shrink-0" />
              <span>Direct Store Dispatch</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#DB4A2B] shrink-0" />
              <span>100% Authenticity Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#DB4A2B] shrink-0" />
              <span>30-Day Return Window</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#DB4A2B] shrink-0" />
              <span>Buyer Protection Guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 flex-1 w-full space-y-10">
        {error && (
          <div className="p-8 border-2 border-[#DB4A2B] bg-[#DB4A2B]/10 text-center space-y-4 shadow-[6px_6px_0px_#DB4A2B]">
            <h3 className="text-lg font-clash font-bold uppercase text-[#1E1E1E]">{error}</h3>
            <p className="text-xs font-satoshi text-[#444444]">
              The merchant storefront you are inspecting has no public listings or has been suspended.
            </p>
            <BrutalistButton to="/" variant="primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Return to Main Marketplace</span>
            </BrutalistButton>
          </div>
        )}

        {!error && (
          <>
            {/* Active Flash Sale Showcase Banner */}
            {storeData?.flashSale?.isActive && (
              <div className="border-2 border-[#1E1E1E] bg-[#1E1E1E] text-[#E4E2DD] p-6 sm:p-8 shadow-[8px_8px_0px_#DB4A2B]">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#DB4A2B] text-white text-[10px] font-mono font-bold uppercase">
                      <Flame className="w-3.5 h-3.5" />
                      <span>LIMITED TIME PROMOTION</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-clash font-bold uppercase tracking-tight text-white">
                      {storeData.flashSale.title}
                    </h2>
                    <p className="text-xs font-satoshi text-zinc-300 leading-relaxed">
                      {storeData.flashSale.description ||
                        `Curated store markdown up to ${storeData.flashSale.discountPercentage}% OFF on verified seasonal collections.`}
                    </p>
                  </div>

                  {/* Countdown Clock */}
                  {timeLeft && (
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#F8A348]">
                        <Clock className="w-4 h-4" />
                        <span>WINDOW CLOSING IN</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <div className="border border-white/40 bg-black/40 px-3 py-2 text-center min-w-[56px]">
                          <div className="text-2xl font-bold leading-none text-white">
                            {String(timeLeft.days).padStart(2, '0')}
                          </div>
                          <div className="text-[9px] uppercase tracking-wider text-zinc-400 mt-1">
                            DAYS
                          </div>
                        </div>
                        <span className="text-xl font-bold text-white">:</span>
                        <div className="border border-white/40 bg-black/40 px-3 py-2 text-center min-w-[56px]">
                          <div className="text-2xl font-bold leading-none text-white">
                            {String(timeLeft.hours).padStart(2, '0')}
                          </div>
                          <div className="text-[9px] uppercase tracking-wider text-zinc-400 mt-1">
                            HOURS
                          </div>
                        </div>
                        <span className="text-xl font-bold text-white">:</span>
                        <div className="border border-white/40 bg-black/40 px-3 py-2 text-center min-w-[56px]">
                          <div className="text-2xl font-bold leading-none text-white">
                            {String(timeLeft.minutes).padStart(2, '0')}
                          </div>
                          <div className="text-[9px] uppercase tracking-wider text-zinc-400 mt-1">
                            MINS
                          </div>
                        </div>
                        <span className="text-xl font-bold text-white">:</span>
                        <div className="border border-white/40 bg-black/40 px-3 py-2 text-center min-w-[56px]">
                          <div className="text-2xl font-bold leading-none text-white">
                            {String(timeLeft.seconds).padStart(2, '0')}
                          </div>
                          <div className="text-[9px] uppercase tracking-wider text-zinc-400 mt-1">
                            SECS
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
              <div className="border-2 border-[#1E1E1E] bg-white p-6 shadow-[6px_6px_0px_#1E1E1E] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b-2 border-[#1E1E1E]">
                  <div className="flex items-center gap-2 text-xs font-clash font-bold uppercase tracking-wider text-[#1E1E1E]">
                    <Ticket className="w-4 h-4 text-[#DB4A2B]" />
                    <span>MERCHANT VOUCHER TOKENS</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-[#1E1E1E] text-white px-2 py-0.5 uppercase">
                    {storeCoupons.length} AVAILABLE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storeCoupons.map((cp) => (
                    <div
                      key={cp._id || cp.code}
                      className="border-2 border-[#1E1E1E] bg-[#E4E2DD] p-4 flex flex-col justify-between space-y-3 hover:shadow-[4px_4px_0px_#1E1E1E] transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-1 bg-[#1E1E1E] text-[#E4E2DD]">
                          {cp.code}
                        </span>
                        <span className="text-xs font-clash font-bold text-[#DB4A2B]">
                          {cp.discountType === 'percentage'
                            ? `${cp.discountValue}% OFF`
                            : `$${cp.discountValue.toFixed(2)} OFF`}
                        </span>
                      </div>
                      <p className="text-xs font-satoshi text-[#444444] line-clamp-1">
                        {cp.description}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-300 text-[10px] font-mono">
                        <span className="text-[#444444]">
                          {cp.minPurchaseAmount > 0
                            ? `MIN: $${cp.minPurchaseAmount.toFixed(2)}`
                            : 'ZERO THRESHOLD'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(cp.code);
                            setCopiedCouponCode(cp.code);
                            setTimeout(() => setCopiedCouponCode(null), 2000);
                          }}
                          className="text-[#1E1E1E] hover:text-[#DB4A2B] font-bold uppercase underline cursor-pointer"
                        >
                          {copiedCouponCode === cp.code ? 'COPIED' : 'COPY VOUCHER'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter & Search Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#1E1E1E]">
              {/* In-Store Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={`Search inside ${companyName}'s catalogue...`}
                  className="w-full pl-10 pr-24 py-2.5 border-2 border-[#1E1E1E] bg-white text-xs font-satoshi text-[#1E1E1E] placeholder:text-[#444444] focus:outline-none"
                />
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1E1E1E]" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#1E1E1E] hover:bg-[#DB4A2B] text-white text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer"
                >
                  Filter
                </button>
              </form>

              {/* Sort selector */}
              <div className="flex items-center gap-4 self-end md:self-auto font-mono text-xs">
                <span className="text-[#444444] uppercase whitespace-nowrap">
                  {totalCount} {totalCount === 1 ? 'ITEM' : 'ITEMS'} RECORDED
                </span>

                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="appearance-none pl-8 pr-8 py-2 border-2 border-[#1E1E1E] bg-white text-xs font-mono font-bold text-[#1E1E1E] focus:outline-none cursor-pointer uppercase"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="price_asc">Sort: Price (Ascending)</option>
                    <option value="price_desc">Sort: Price (Descending)</option>
                    <option value="rating">Sort: Highest Rated</option>
                  </select>
                  <ArrowUpDown className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1E1E1E] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Merchant Category Filter Pills */}
            {storeData && storeData.categories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => handleCategorySelect('all')}
                  className={`px-4 py-2 border-2 border-[#1E1E1E] text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === 'all'
                      ? 'bg-[#1E1E1E] text-white shadow-[3px_3px_0px_#DB4A2B]'
                      : 'bg-white hover:bg-[#D9D6D0] text-[#1E1E1E]'
                  }`}
                >
                  ALL ITEMS ({storeData.totalProducts})
                </button>

                {storeData.categories.map((cat) => {
                  const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className={`px-4 py-2 border-2 border-[#1E1E1E] text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#1E1E1E] text-white shadow-[3px_3px_0px_#DB4A2B]'
                          : 'bg-white hover:bg-[#D9D6D0] text-[#1E1E1E]'
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
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="font-bold uppercase text-[#444444]">ACTIVE CRITERIA:</span>
                {search && (
                  <span className="px-2 py-0.5 border border-[#1E1E1E] bg-white text-[#1E1E1E]">
                    SEARCH: &ldquo;{search}&rdquo;
                  </span>
                )}
                {activeCategory !== 'all' && (
                  <span className="px-2 py-0.5 border border-[#1E1E1E] bg-white text-[#1E1E1E] uppercase">
                    CATEGORY: {activeCategory}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-[#DB4A2B] font-bold uppercase underline cursor-pointer ml-2"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Product Grid / Loading / Empty State */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="border-2 border-[#1E1E1E] bg-white p-4 space-y-4 animate-pulse shadow-[4px_4px_0px_#1E1E1E]"
                  >
                    <div className="w-full aspect-[3/4] bg-[#E4E2DD]" />
                    <div className="h-4 bg-[#E4E2DD] w-3/4" />
                    <div className="h-3 bg-[#E4E2DD] w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center border-2 border-[#1E1E1E] bg-white p-8 space-y-4 max-w-lg mx-auto my-6 shadow-[6px_6px_0px_#1E1E1E]">
                <div className="w-16 h-16 border-2 border-[#1E1E1E] bg-[#E4E2DD] text-[#1E1E1E] flex items-center justify-center mx-auto">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-clash font-bold text-[#1E1E1E] uppercase">
                  No Catalog Artifacts Located
                </h3>
                <p className="text-xs font-satoshi text-[#444444] leading-relaxed">
                  No matching items correspond to the selected criteria in {companyName}&apos;s verified archives.
                </p>
                <BrutalistButton onClick={handleClearFilters} variant="primary">
                  <span>Reset Store Filters</span>
                </BrutalistButton>
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

export default CompanyStorePage;
