import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Star,
  Building2,
  Package,
  X,
  ShoppingBag,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  ArrowUpRight,
  Plus,
  Minus,
  ExternalLink,
  Sparkles,
  Zap,
  Clock,
  Truck,
  RotateCcw,
  ShieldCheck,
  Lock,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Filter,
} from 'lucide-react';
import { getProductsApi, getCategoriesApi } from '../services/productService';
import { ForYouRecommendations } from '../components/recommendations/ForYouRecommendations';
import { ProductCard } from '../components/ProductCard';
import { RawAtmosphere } from '../components/RawAtmosphere';
import { TAXONOMY_CATEGORIES, getTaxonomyCategory } from '../config/taxonomy';
import { useCart } from '../context/CartContext';
import type { Product } from '../types/product';

const BANNERS = [
  {
    id: 1,
    title: 'THE ARCHITECTURE OF SILHOUETTE',
    subtitle: 'Next-Generation Audio Telemetry, High-Density Computing & Architectural Industrial Design',
    category: 'electronics',
    badge: 'COLLECTION 2026 // VOL. 01',
    image: '/banners/tech_banner.jpg',
    cta: 'EXPLORE TECH ARCHIVE',
    tagline: 'FORM FOLLOWS PURE EXPRESSION',
  },
  {
    id: 2,
    title: 'AUTUMN STRUCTURAL TAILORING',
    subtitle: 'Elevated Cashmere Textures, Angular Outerwear & Monumental Modern Minimalist Cuts',
    category: 'fashion',
    badge: 'PARISIAN RUNWAY DROP',
    image: '/banners/fashion_banner.jpg',
    cta: 'SHOP LUXE EDIT',
    tagline: 'BRUTALIST ELEGANCE IN TEXTURE',
  },
  {
    id: 3,
    title: 'MONUMENTAL LIVING SPACES',
    subtitle: 'Warm Architectural Minimalism, Modular Danish Ceramics & Sculptural Raw Furnishings',
    category: 'home-furniture',
    badge: 'HABITAT ARCHIVE 2026',
    image: '/banners/home_banner.jpg',
    cta: 'UPGRADE LIVING ARCHIVE',
    tagline: 'ORGANIC TECTONIC MINIMALISM',
  },
];

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category');
  const subcategoryParam = searchParams.get('subcategory') || '';
  const activeCategory = categoryParam || 'all';
  const sort = (searchParams.get('sort') as 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'oldest') || 'newest';

  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [addingId, setAddingId] = useState<string | null>(null);

  const { addToCart } = useCart();
  const [_, setDynamicCategories] = useState<string[]>([]);

  useEffect(() => {
    getCategoriesApi()
      .then((res) => {
        if (res?.categories && res.categories.length > 0) {
          setDynamicCategories(res.categories);
        }
      })
      .catch((err) => console.warn('Categories API error:', err));
  }, []);

  // Slide rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Countdown timer for Flash Drops
  const [timeLeft, setTimeLeft] = useState({
    hours: 6,
    minutes: 42,
    seconds: 18,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 6, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // IntersectionObserver for reveal animations
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal-on-scroll');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [products, activeCategory, search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isHome = !search.trim() && categoryParam === null && !subcategoryParam;
      const data = await getProductsApi({
        search: search.trim() || undefined,
        category: activeCategory !== 'all' ? activeCategory : undefined,
        subcategory: subcategoryParam || undefined,
        sort,
        limit: isHome ? 60 : 48,
      });
      setProducts(data.products || []);
      setTotalCount(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory, categoryParam, subcategoryParam, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategorySelect = (cat: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('category', cat);
    params.delete('subcategory');
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

  const handleClearFilters = () => {
    const params = new URLSearchParams();
    params.set('category', 'all');
    params.delete('subcategory');
    setSearchParams(params);
  };

  const isSearchOrFilterMode = Boolean(search || categoryParam !== null || subcategoryParam);
  const activeBanner = BANNERS[currentSlide] || BANNERS[0];

  return (
    <div className="min-h-screen bg-[#E4E2DD] text-[#1E1E1E] flex flex-col font-satoshi selection:bg-[#DB4A2B] selection:text-[#E4E2DD] relative">
      {/* Background Atmosphere: Radial blobs + grain overlay */}
      <RawAtmosphere variant="editorial" />

      {!isSearchOrFilterMode && (
        <>
          {/* SECTION 1: FULL-VIEWPORT EDITORIAL HERO — SWISS BRUTALIST POSTER */}
          <section className="relative w-full min-h-[90vh] lg:min-h-[92vh] flex flex-col justify-between border-b-2 border-[#1E1E1E] px-4 sm:px-6 lg:px-12 py-12 lg:py-16 overflow-hidden">
            {/* Top Poster Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E1E1E]/20 pb-4 text-xs font-mono uppercase tracking-widest text-[#444444]">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-[#DB4A2B] animate-pulse" />
                <span className="font-bold text-[#1E1E1E]">NOVA COMMERCE // GLOBAL MARKETPLACE</span>
                <span>/</span>
                <span>EDITION 2026</span>
              </div>
              <div className="flex items-center gap-6">
                <span>ZURICH &bull; TOKYO &bull; NEW YORK</span>
                <span className="text-[#1E1E1E] font-bold">GRID 12-COL</span>
              </div>
            </div>

            {/* Asymmetric Typography Headline Composition */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end py-10">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-block px-3 py-1 bg-[#1E1E1E] text-[#E4E2DD] font-mono text-xs font-bold uppercase tracking-widest">
                  {activeBanner.badge}
                </div>
                <h1 className="font-clash text-5xl sm:text-7xl lg:text-9xl font-bold uppercase tracking-[-0.05em] text-[#1E1E1E] leading-[0.88] select-none">
                  {activeBanner.title}
                </h1>
              </div>

              {/* Supporting Asymmetric Editorial Description & Actions */}
              <div className="lg:col-span-4 space-y-6 lg:pl-6 lg:border-l border-[#1E1E1E]/20">
                <p className="font-satoshi text-sm sm:text-base text-[#444444] leading-relaxed">
                  {activeBanner.subtitle}
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(activeBanner.category)}
                    className="raw-btn px-8 py-4 bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E] text-xs font-bold uppercase tracking-widest cursor-pointer group flex items-center justify-center gap-2"
                  >
                    <span>{activeBanner.cta}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <Link
                    to="/categories"
                    className="px-6 py-4 bg-[#FFFFFF] hover:bg-[#1E1E1E] hover:text-[#E4E2DD] text-[#1E1E1E] border border-[#1E1E1E]/30 transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <span>ARCHIVE INDEX</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="text-[11px] font-mono text-[#444444] uppercase tracking-wider pt-2">
                  PARALLAX TECTONIC // {activeBanner.tagline}
                </div>
              </div>
            </div>

            {/* Hero Carousel Navigation Strip */}
            <div className="pt-6 border-t border-[#1E1E1E]/20 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-4">
                {BANNERS.map((b, idx) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`pb-1 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      idx === currentSlide
                        ? 'border-b-2 border-[#DB4A2B] text-[#1E1E1E]'
                        : 'border-b-2 border-transparent text-[#444444] hover:text-[#1E1E1E]'
                    }`}
                  >
                    [0{idx + 1}] {b.category.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentSlide((prev) => (prev === 0 ? BANNERS.length - 1 : prev - 1))
                  }
                  className="w-10 h-10 border border-[#1E1E1E]/30 bg-[#FFFFFF] hover:bg-[#1E1E1E] hover:text-[#E4E2DD] flex items-center justify-center transition-colors cursor-pointer"
                  title="Previous banner"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % BANNERS.length)}
                  className="w-10 h-10 border border-[#1E1E1E]/30 bg-[#FFFFFF] hover:bg-[#1E1E1E] hover:text-[#E4E2DD] flex items-center justify-center transition-colors cursor-pointer"
                  title="Next banner"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 2: ASYMMETRIC 12-COLUMN CAMPAIGN GRID */}
          <section className="border-b-2 border-[#1E1E1E] bg-[#D9D6D0]/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-[#1E1E1E]">
              {/* Campaign 1: Electronics (7 Columns) */}
              <div
                onClick={() => handleCategorySelect('electronics')}
                className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-between group cursor-pointer relative overflow-hidden min-h-[440px]"
              >
                <div className="space-y-3 z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1E1E1E] text-[#FF89A9] text-[10px] font-mono font-bold uppercase tracking-widest">
                    <Flame className="w-3.5 h-3.5 text-[#DB4A2B]" />
                    <span>CURATED DROP // AUDIO & TECH</span>
                  </div>
                  <h3 className="font-clash text-3xl sm:text-5xl font-bold uppercase tracking-[-0.04em] text-[#1E1E1E] group-hover:text-[#DB4A2B] transition-colors duration-200">
                    NEXT-GEN AUDIO & COMPUTING
                  </h3>
                  <p className="text-xs sm:text-sm text-[#444444] max-w-lg leading-relaxed">
                    Acoustic spatial drivers, ultra-light carbon architecture, and tactile minimal workstations.
                  </p>
                </div>

                <div className="pt-8 flex items-end justify-between z-10">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1E1E1E] group-hover:text-[#DB4A2B] flex items-center gap-2">
                    <span>EXPLORE TECH CATALOG</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </span>
                  <div className="w-12 h-12 rounded-full border-2 border-[#1E1E1E] group-hover:bg-[#1E1E1E] group-hover:text-[#FFFFFF] flex items-center justify-center transition-colors">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Campaign 2: Luxury Fashion (5 Columns) */}
              <div
                onClick={() => handleCategorySelect('fashion')}
                className="lg:col-span-5 p-6 sm:p-10 lg:p-14 flex flex-col justify-between group cursor-pointer relative overflow-hidden min-h-[440px] bg-[#FFFFFF]"
              >
                <div className="space-y-3 z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#DB4A2B] text-[#FFFFFF] text-[10px] font-mono font-bold uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>HAUTE RUNWAY EDIT</span>
                  </div>
                  <h3 className="font-clash text-3xl sm:text-4xl font-bold uppercase tracking-[-0.04em] text-[#1E1E1E] group-hover:text-[#FF89A9] transition-colors duration-200">
                    DESIGNER WARDROBE & CUTS
                  </h3>
                  <p className="text-xs text-[#444444] leading-relaxed">
                    Heavy gauge wool, architectural trench silhouettes, and artisanal luxury leatherwear.
                  </p>
                </div>

                <div className="pt-8 flex items-end justify-between z-10">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1E1E1E] group-hover:text-[#FF89A9] flex items-center gap-2">
                    <span>VIEW RUNWAY DROP</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </span>
                  <div className="w-12 h-12 rounded-full border-2 border-[#1E1E1E] group-hover:bg-[#1E1E1E] group-hover:text-[#FFFFFF] flex items-center justify-center transition-colors">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: FLASH DEALS RADAR WITH LIVE COUNTDOWN */}
          <section className="border-b-2 border-[#1E1E1E] bg-[#1E1E1E] text-[#E4E2DD] p-6 sm:p-10 lg:p-12">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-[#DB4A2B] text-[#FFFFFF] font-mono text-[10px] font-bold uppercase tracking-widest">
                    TIMED RELEASE
                  </span>
                  <span className="text-[11px] font-mono text-[#F8A348] uppercase tracking-wider">
                    UP TO 50% OFF ARCHIVE SILHOUETTES
                  </span>
                </div>
                <h3 className="font-clash text-2xl sm:text-4xl font-bold uppercase tracking-tight text-[#FFFFFF]">
                  FLASH PROMOTIONS RADAR
                </h3>
                <p className="text-xs text-[#E4E2DD]/70 max-w-xl">
                  Limited inventory batch markdowns on flagship models, timepieces, and acoustic systems.
                </p>
              </div>

              {/* Countdown Ticker */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 font-mono">
                  <div className="px-3.5 py-2.5 bg-[#FFFFFF]/10 border border-[#FFFFFF]/20 text-center min-w-[58px]">
                    <span className="text-xl sm:text-2xl font-bold text-[#FFFFFF] block">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-[#E4E2DD]/50 uppercase">HOURS</span>
                  </div>
                  <span className="text-xl font-bold text-[#DB4A2B]">:</span>
                  <div className="px-3.5 py-2.5 bg-[#FFFFFF]/10 border border-[#FFFFFF]/20 text-center min-w-[58px]">
                    <span className="text-xl sm:text-2xl font-bold text-[#FFFFFF] block">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-[#E4E2DD]/50 uppercase">MINS</span>
                  </div>
                  <span className="text-xl font-bold text-[#DB4A2B]">:</span>
                  <div className="px-3.5 py-2.5 bg-[#FFFFFF]/10 border border-[#FFFFFF]/20 text-center min-w-[58px]">
                    <span className="text-xl sm:text-2xl font-bold text-[#DB4A2B] block">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-[#E4E2DD]/50 uppercase">SECS</span>
                  </div>
                </div>

                <Link
                  to="/deals"
                  className="px-6 py-3 bg-[#DB4A2B] hover:bg-[#FFFFFF] hover:text-[#1E1E1E] text-[#FFFFFF] text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <span>SHOP DEALS</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* SECTION 4: EDITORIAL TRUST SYSTEM STRIP */}
          <section className="border-b-2 border-[#1E1E1E] bg-[#FFFFFF]">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#1E1E1E]/20">
              <div className="p-6 flex items-center gap-3.5">
                <Truck className="w-5 h-5 text-[#DB4A2B] shrink-0" />
                <div>
                  <div className="font-clash text-xs font-bold uppercase text-[#1E1E1E]">FREE EXPRESS COURIER</div>
                  <div className="text-[10px] font-mono text-[#444444]">ORDERS OVER $50 NATIONWIDE</div>
                </div>
              </div>
              <div className="p-6 flex items-center gap-3.5">
                <RotateCcw className="w-5 h-5 text-[#DB4A2B] shrink-0" />
                <div>
                  <div className="font-clash text-xs font-bold uppercase text-[#1E1E1E]">30-DAY SAGA RETURNS</div>
                  <div className="text-[10px] font-mono text-[#444444]">INSTANT TRANSACTION ROLLBACK</div>
                </div>
              </div>
              <div className="p-6 flex items-center gap-3.5">
                <ShieldCheck className="w-5 h-5 text-[#DB4A2B] shrink-0" />
                <div>
                  <div className="font-clash text-xs font-bold uppercase text-[#1E1E1E]">100% AUTHENTIC ORIGIN</div>
                  <div className="text-[10px] font-mono text-[#444444]">CERTIFIED BRAND MERCHANTS</div>
                </div>
              </div>
              <div className="p-6 flex items-center gap-3.5">
                <Lock className="w-5 h-5 text-[#DB4A2B] shrink-0" />
                <div>
                  <div className="font-clash text-xs font-bold uppercase text-[#1E1E1E]">256-BIT ENCRYPTION</div>
                  <div className="text-[10px] font-mono text-[#444444]">PCI-DSS COMPLIANT GATEWAY</div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* MAIN CATALOG CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex-1 w-full space-y-16">
        {!isSearchOrFilterMode && <ForYouRecommendations />}

        {error && (
          <div className="p-4 border-2 border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#DB4A2B] text-xs font-mono font-bold uppercase">
            [ERROR] {error}
          </div>
        )}

        {isSearchOrFilterMode ? (
          /* Search & Filtered Catalog View */
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b-2 border-[#1E1E1E]">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#444444]">
                  CATALOG INVENTORY FILTER
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <h2 className="font-clash text-2xl sm:text-4xl font-bold uppercase tracking-tight text-[#1E1E1E]">
                    {search
                      ? `SEARCH: "${search}"`
                      : activeCategory === 'all'
                      ? 'ALL PRODUCTS ARCHIVE'
                      : `${activeCategory.toUpperCase()} COLLECTION`}
                  </h2>
                  <span className="px-2.5 py-0.5 bg-[#1E1E1E] text-[#E4E2DD] font-mono text-xs font-bold">
                    {totalCount} ITEMS
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3 font-mono text-xs">
                  <span className="text-[#444444]">ACTIVE FILTERS:</span>
                  {search && (
                    <span className="px-2 py-0.5 bg-[#FFFFFF] border border-[#1E1E1E] text-[#1E1E1E] text-[10px] font-bold">
                      KEYWORD: {search}
                    </span>
                  )}
                  {activeCategory !== 'all' ? (
                    <span className="px-2 py-0.5 bg-[#FFFFFF] border border-[#1E1E1E] text-[#1E1E1E] text-[10px] font-bold uppercase">
                      CAT: {getTaxonomyCategory(activeCategory)?.name || activeCategory}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-[#FFFFFF] border border-[#1E1E1E]/40 text-[#444444] text-[10px]">
                      CAT: ALL
                    </span>
                  )}
                  {subcategoryParam && (
                    <span className="px-2 py-0.5 bg-[#DB4A2B] text-[#FFFFFF] text-[10px] font-bold flex items-center gap-1.5 uppercase">
                      <span>SUB: {subcategoryParam}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const params = new URLSearchParams(searchParams);
                          params.delete('subcategory');
                          setSearchParams(params);
                        }}
                        className="hover:underline cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-[#DB4A2B] font-bold uppercase hover:underline ml-2 cursor-pointer text-[10px]"
                  >
                    RESET ALL
                  </button>
                </div>
              </div>

              {/* Sort Selector: Swiss Brutalist Sharp Rectangular */}
              <div className="flex items-center gap-2 self-start sm:self-auto font-mono">
                <span className="text-[10px] font-bold text-[#444444] uppercase">ORDER BY:</span>
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-3 py-2 bg-[#FFFFFF] border border-[#1E1E1E] text-xs font-bold uppercase tracking-wider text-[#1E1E1E] focus:outline-none focus:border-[#DB4A2B] cursor-pointer"
                >
                  <option value="newest">NEWEST ARRIVALS</option>
                  <option value="price_asc">PRICE (LOW TO HIGH)</option>
                  <option value="price_desc">PRICE (HIGH TO LOW)</option>
                  <option value="rating">TOP RATED</option>
                </select>
              </div>
            </div>

            {/* Department Horizontal Scrolling Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none font-mono text-xs">
              <button
                type="button"
                onClick={() => handleCategorySelect('all')}
                className={`px-3.5 py-2 font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-[#1E1E1E] text-[#E4E2DD]'
                    : 'bg-[#FFFFFF] border border-[#1E1E1E]/20 text-[#1E1E1E] hover:border-[#1E1E1E]'
                }`}
              >
                ALL ARCHIVES
              </button>
              {TAXONOMY_CATEGORIES.map((cat) => {
                const isActive = activeCategory.toLowerCase() === cat.id.toLowerCase();
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`px-3.5 py-2 font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${
                      isActive
                        ? 'bg-[#1E1E1E] text-[#E4E2DD]'
                        : 'bg-[#FFFFFF] border border-[#1E1E1E]/20 text-[#1E1E1E] hover:border-[#1E1E1E]'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
              <Link
                to="/categories"
                className="px-3.5 py-2 bg-[#D9D6D0] text-[#1E1E1E] font-bold uppercase tracking-wider whitespace-nowrap hover:bg-[#DB4A2B] hover:text-[#FFFFFF] transition"
              >
                24 DEPARTMENTS →
              </Link>
            </div>

            {/* Product Grid: Strict 3 columns desktop, 2 tablets, 1-2 mobile */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-[#FFFFFF] border border-[#1E1E1E]/20 p-4 space-y-3 animate-pulse">
                    <div className="w-full aspect-[3/4] bg-[#E4E2DD]/60" />
                    <div className="h-4 bg-[#E4E2DD] w-3/4" />
                    <div className="h-3 bg-[#E4E2DD] w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center bg-[#FFFFFF] border-2 border-[#1E1E1E] p-8 space-y-4 max-w-lg mx-auto my-8">
                <Package className="w-10 h-10 text-[#444444] mx-auto" />
                <h3 className="font-clash text-lg font-bold uppercase tracking-tight text-[#1E1E1E]">
                  NO MATCHING PRODUCTS IN ARCHIVE
                </h3>
                <p className="text-xs text-[#444444] leading-relaxed">
                  Adjust your search terms or reset category filters to view the full product directory.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="raw-btn px-6 py-3 bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E] text-xs font-bold uppercase tracking-widest cursor-pointer"
                >
                  RESET SEARCH FILTERS
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {products.map((product, idx) => (
                  <ProductCard key={product._id} product={product} index={idx} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Homepage: Curated Editorial Department Showcases (3 columns editorial grid) */
          <div className="space-y-20">
            {loading ? (
              <div className="space-y-12">
                {[1, 2].map((group) => (
                  <div key={group} className="space-y-4">
                    <div className="h-8 bg-[#E4E2DD] w-64 animate-pulse" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-[#FFFFFF] border border-[#1E1E1E]/20 p-4 space-y-3 animate-pulse">
                          <div className="w-full aspect-[3/4] bg-[#E4E2DD]" />
                          <div className="h-4 bg-[#E4E2DD] w-3/4" />
                          <div className="h-3 bg-[#E4E2DD] w-1/2" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {TAXONOMY_CATEGORIES.map((taxCat) => {
                  const matchingProducts = products.filter(
                    (p) => p.category?.toLowerCase() === taxCat.id.toLowerCase()
                  );
                  if (matchingProducts.length === 0) return null;

                  return (
                    <section key={taxCat.id} className="reveal-on-scroll space-y-6">
                      {/* Department Header */}
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-[#1E1E1E]">
                        <div>
                          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#DB4A2B] block">
                            ARCHIVE DISPATCH &bull; {taxCat.id.toUpperCase()}
                          </span>
                          <h2 className="font-clash text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#1E1E1E] mt-0.5">
                            {taxCat.name}
                          </h2>
                          <p className="text-xs text-[#444444] mt-1 max-w-xl">
                            {taxCat.desc}
                          </p>
                        </div>

                        <Link
                          to={`/?category=${encodeURIComponent(taxCat.id)}`}
                          className="font-mono text-xs font-bold uppercase tracking-widest text-[#1E1E1E] hover:text-[#DB4A2B] flex items-center gap-1.5 transition-colors group shrink-0"
                        >
                          <span>VIEW ALL {matchingProducts.length} ITEMS</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>

                      {/* Editorial Product Grid: Exactly 3 columns on desktop (Section 4) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matchingProducts.slice(0, 6).map((product, idx) => (
                          <ProductCard key={product._id} product={product} index={idx} />
                        ))}
                      </div>
                    </section>
                  );
                })}

                {/* If no categorized products matched, show all products in editorial 3-col grid */}
                {products.length > 0 && (
                  <section className="reveal-on-scroll space-y-6 pt-6">
                    <div className="flex items-end justify-between pb-4 border-b-2 border-[#1E1E1E]">
                      <div>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#DB4A2B]">
                          CURATED ARCHIVE SELECTION
                        </span>
                        <h2 className="font-clash text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#1E1E1E] mt-0.5">
                          FEATURED COMMERCE CATALOG
                        </h2>
                      </div>
                      <Link
                        to="/categories"
                        className="font-mono text-xs font-bold uppercase tracking-widest text-[#1E1E1E] hover:text-[#DB4A2B] flex items-center gap-1.5"
                      >
                        <span>BROWSE DEPARTMENTS</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.slice(0, 12).map((product, idx) => (
                        <ProductCard key={product._id} product={product} index={idx} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
