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
} from 'lucide-react';
import { getProductsApi, getCategoriesApi } from '../services/productService';
import { ForYouRecommendations } from '../components/recommendations/ForYouRecommendations';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import type { Product } from '../types/product';

const BANNERS = [
  {
    id: 1,
    title: 'The Future of Connectivity',
    subtitle: 'Next-Gen Audio, Ultra-Light Workstations & Computing Essentials',
    category: 'electronics',
    badge: 'FLAGSHIP TECH 2026',
    image: '/banners/tech_banner.jpg',
    cta: 'Explore Tech Catalog',
    accentColor: 'from-zinc-950/95 via-zinc-900/70 to-transparent',
  },
  {
    id: 2,
    title: 'Autumn Tailored Wardrobe',
    subtitle: 'Elevated textures, structured outerwear, and modern minimalist cuts',
    category: 'fashion',
    badge: 'NEW SEASON DROP',
    image: '/banners/fashion_banner.jpg',
    cta: 'Shop Collection',
    accentColor: 'from-zinc-950/95 via-stone-900/70 to-transparent',
  },
  {
    id: 3,
    title: 'Scandinavian Living Space',
    subtitle: 'Warm minimalism, architectural lighting, and artisanal ceramics',
    category: 'home',
    badge: 'HOME SANCTUARY',
    image: '/banners/home_banner.jpg',
    cta: 'Upgrade Space',
    accentColor: 'from-zinc-950/95 via-zinc-900/70 to-transparent',
  },
];

const HOME_CATEGORY_SECTIONS = [
  {
    id: 'electronics',
    title: 'Audio & Premium Computing',
    subtitle: 'High-fidelity acoustic systems, precision mice, and 4K displays',
  },
  {
    id: 'fashion',
    title: 'Contemporary Essentials',
    subtitle: 'Organic cotton garments, breathable knitwear, and leather goods',
  },
  {
    id: 'home',
    title: 'Sanctuary & Modern Living',
    subtitle: 'Handmade ceramic serveware, ambient luminaires, and linen textiles',
  },
  {
    id: 'beauty',
    title: 'Clean Beauty & Skincare',
    subtitle: 'Pure botanicals, restorative formulas, and organic self-care essentials',
  },
  {
    id: 'sports',
    title: 'Sports & Active Lifestyle',
    subtitle: 'Athletic wear, performance training gear, and fitness accessories',
  },
  {
    id: 'books',
    title: 'Books & Media',
    subtitle: 'Bestselling novels, educational literature, and audiobooks',
  },
];

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category');
  const activeCategory = categoryParam || 'all';
  const sort = (searchParams.get('sort') as 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'oldest') || 'newest';

  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [addingId, setAddingId] = useState<string | null>(null);

  const { addToCart } = useCart();

  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);

  useEffect(() => {
    getCategoriesApi()
      .then((res) => {
        if (res?.categories && res.categories.length > 0) {
          setDynamicCategories(res.categories);
        }
      })
      .catch((err) => console.warn('Categories API error:', err));
  }, []);

  const bannerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bannerRef.current) return;
    const rect = bannerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const [timeLeft, setTimeLeft] = useState({
    hours: 5,
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
        return { hours: 5, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // IntersectionObserver for ultra-smooth scroll-triggered entrance animations
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
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [products, activeCategory, search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isHome = !search.trim() && categoryParam === null;
      const data = await getProductsApi({
        search: search.trim() || undefined,
        category: activeCategory !== 'all' ? activeCategory : undefined,
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
  }, [search, activeCategory, categoryParam, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategorySelect = (cat: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('category', cat);
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
    setSearchParams(params);
  };

  const renderProductCard = (product: Product, idx: number) => {
    return <ProductCard key={product._id} product={product} index={idx} />;
  };

  const isSearchOrFilterMode = Boolean(search || categoryParam !== null);
  const activeBanner = BANNERS[currentSlide] || BANNERS[0];

  return (
    <div className="min-h-screen bg-zinc-50/60 text-zinc-900 flex flex-col font-sans">
      {!isSearchOrFilterMode && (
        <>
          {/* Section 1: Interactive Hero Banner Carousel */}
          <section
            ref={bannerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full overflow-hidden bg-zinc-950 text-white min-h-[460px] sm:min-h-[520px] flex items-center justify-center select-none"
          >
            {BANNERS.map((banner, index) => {
              const isActive = index === currentSlide;
              return (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out will-change-transform scale-105"
                    style={{
                      backgroundImage: `url(${banner.image})`,
                      transform: isActive
                        ? `scale(1.06) translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px)`
                        : 'scale(1.0)',
                    }}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-r ${banner.accentColor}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                </div>
              );
            })}

            <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
              <div
                className="max-w-2xl space-y-4 transition-transform duration-500 will-change-transform"
                style={{
                  transform: `translate(${mousePos.x * -0.5}px, ${mousePos.y * -0.5}px)`,
                }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md text-white border border-white/15 shadow-sm">
                  <Flame className="w-3.5 h-3.5 text-zinc-300" />
                  <span>{activeBanner.badge}</span>
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <span className="text-[11px] text-zinc-300 font-mono">SEASON 2026</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                  {activeBanner.title}
                </h1>

                <p className="text-sm sm:text-base text-zinc-300 font-medium max-w-lg leading-relaxed drop-shadow">
                  {activeBanner.subtitle}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(activeBanner.category)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-extrabold text-zinc-950 bg-white hover:bg-zinc-100 shadow-xl transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span>{activeBanner.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setCurrentSlide((prev) => (prev === 0 ? BANNERS.length - 1 : prev - 1))
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-zinc-950/50 hover:bg-zinc-900/90 text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer hidden sm:flex items-center justify-center"
              title="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentSlide((prev) => (prev + 1) % BANNERS.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-zinc-950/50 hover:bg-zinc-900/90 text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer hidden sm:flex items-center justify-center"
              title="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
              {BANNERS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  title={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </section>

          {/* Section 2: Bento Grid Showcase (Reveal on scroll) */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-6">
            <div className="reveal-on-scroll flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-950 tracking-tight">
                  Featured Departments & Flash Sale
                </h2>
                <p className="text-xs text-zinc-500">
                  Explore curated collections and limited-time marketplace deals
                </p>
              </div>
            </div>

            {/* Row 1: Two 50% Width Hero Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {/* Row 1 Card 1: Electronics */}
              <div
                onClick={() => handleCategorySelect('electronics')}
                className="reveal-on-scroll group relative min-h-[300px] sm:min-h-[340px] rounded-3xl overflow-hidden cursor-pointer bg-zinc-950 border border-zinc-200/80 shadow-2xs hover:shadow-xl transition-all duration-500 flex flex-col justify-end p-6 sm:p-8"
              >
                <img
                  src="/banners/tech_banner.jpg"
                  alt="Tech Collection"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                <div className="relative z-10 space-y-2.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 backdrop-blur-md text-white border border-white/15 shadow-xs">
                    <Flame className="w-3.5 h-3.5 text-zinc-300" />
                    <span>TRENDING IN TECH</span>
                    <span className="w-1 h-1 rounded-full bg-white/40" />
                    <span className="text-zinc-300">UP TO 35% OFF</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    Next-Gen Audio & Computing
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 max-w-md line-clamp-2">
                    Noise-cancelling flagship audio, ultra-light workstations, and wearable telemetry.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-white group-hover:text-zinc-300 transition-colors">
                      <span>Explore Tech Catalog</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 1 Card 2: Luxury Fashion */}
              <div
                onClick={() => handleCategorySelect('fashion')}
                className="reveal-on-scroll group relative min-h-[300px] sm:min-h-[340px] rounded-3xl overflow-hidden cursor-pointer bg-zinc-950 border border-zinc-200/80 shadow-2xs hover:shadow-xl transition-all duration-500 flex flex-col justify-end p-6 sm:p-8"
                style={{ transitionDelay: '120ms' }}
              >
                <img
                  src="/banners/fashion_banner.jpg"
                  alt="Designer Fashion"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                <div className="relative z-10 space-y-2.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 backdrop-blur-md text-white border border-white/15 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                    <span>AUTUMN LUXE EDIT</span>
                    <span className="w-1 h-1 rounded-full bg-white/40" />
                    <span className="text-zinc-300">NEW ARRIVALS</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    Modern Luxe & Streetwear Styles
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 max-w-md line-clamp-2">
                    Curated cashmere knitwear, minimalist outerwear, and luxury designer footwear.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-white group-hover:text-zinc-300 transition-colors">
                      <span>Shop Designer Fashion</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Three Cards (3 cols | 6 cols | 3 cols in 12-col grid) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-stretch">
              {/* Row 2 Card 1: Home & Living (Left ~ 25%) */}
              <div
                onClick={() => handleCategorySelect('home')}
                className="reveal-on-scroll md:col-span-12 lg:col-span-3 group relative min-h-[260px] rounded-3xl overflow-hidden cursor-pointer bg-zinc-950 border border-zinc-200/80 shadow-2xs hover:shadow-xl transition-all duration-500 flex flex-col justify-end p-6"
                style={{ transitionDelay: '100ms' }}
              >
                <img
                  src="/banners/home_banner.jpg"
                  alt="Home & Living"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                <div className="relative z-10 space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 backdrop-blur-md text-zinc-200 border border-white/15">
                    <span>SMART LIVING</span>
                  </span>
                  <h4 className="text-lg font-bold text-white leading-snug">
                    Minimalist Home & Ambient Decor
                  </h4>
                  <p className="text-[11px] text-zinc-300 font-medium">From $29.99</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white group-hover:text-zinc-300 transition-colors pt-1">
                    <span>Shop Home</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>

              {/* Row 2 Card 2: Flash Deals Hub (Center Wide ~ 50%) */}
              <div
                onClick={() => handleCategorySelect('all')}
                className="reveal-on-scroll md:col-span-12 lg:col-span-6 group relative min-h-[260px] rounded-3xl overflow-hidden cursor-pointer bg-zinc-950 border border-zinc-200/80 shadow-2xs hover:shadow-xl transition-all duration-500 flex flex-col justify-end p-6 sm:p-8"
                style={{ transitionDelay: '200ms' }}
              >
                <img
                  src="/banners/flash_deals_banner.jpg"
                  alt="Flash Marketplace Sale"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                <div className="relative z-10 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white text-zinc-950 shadow-xs">
                      <Zap className="w-3.5 h-3.5 fill-zinc-950" />
                      <span>FLASH SALE HUB</span>
                    </span>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-zinc-900/80 text-zinc-200 border border-zinc-700 backdrop-blur-md">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Limited-Time Marketplace Bundles
                  </h3>
                  <p className="text-xs text-zinc-300 max-w-md">
                    Unlock up to 50% discount on flagship gadgets, verified timepieces, and accessories.
                  </p>

                  <div className="pt-1">
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">
                      <span>Explore Flash Deals</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2 Card 3: Beauty & Skincare (Right ~ 25%) */}
              <div
                onClick={() => handleCategorySelect('beauty')}
                className="reveal-on-scroll md:col-span-12 lg:col-span-3 group relative min-h-[260px] rounded-3xl overflow-hidden cursor-pointer bg-zinc-950 border border-zinc-200/80 shadow-2xs hover:shadow-xl transition-all duration-500 flex flex-col justify-end p-6"
                style={{ transitionDelay: '300ms' }}
              >
                <img
                  src="/banners/beauty_banner.jpg"
                  alt="Organic Beauty"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                <div className="relative z-10 space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 backdrop-blur-md text-zinc-200 border border-white/15">
                    <span>PURE BOTANICALS</span>
                  </span>
                  <h4 className="text-lg font-bold text-white leading-snug">
                    Clean Beauty & Skincare
                  </h4>
                  <p className="text-[11px] text-zinc-300 font-medium">100% Organic Extracts</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white group-hover:text-zinc-300 transition-colors pt-1">
                    <span>Discover Beauty</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </div>

            {/* Trust Features Strip */}
            <div className="reveal-on-scroll grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-950">Free Express Delivery</div>
                  <div className="text-[11px] text-zinc-500">On all orders over $50</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-950">30-Day Easy Returns</div>
                  <div className="text-[11px] text-zinc-500">Hassle-free refund policy</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-950">Buyer Protection</div>
                  <div className="text-[11px] text-zinc-500">Verified seller guarantee</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-950">256-Bit SSL Security</div>
                  <div className="text-[11px] text-zinc-500">End-to-end encryption</div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 flex-1 w-full space-y-12">
        {!isSearchOrFilterMode && <ForYouRecommendations />}

        {error && (
          <div className="p-4 my-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        {isSearchOrFilterMode ? (
          /* Search & Filtered Catalog View */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-zinc-950 tracking-tight">
                    {search
                      ? `Search results for "${search}"`
                      : activeCategory === 'all'
                      ? 'All Products'
                      : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Collection`}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                    {totalCount} items
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-zinc-500">Active filters:</span>
                  {search && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 text-xs font-medium border border-zinc-200">
                      <span>Keyword: {search}</span>
                    </span>
                  )}
                  {activeCategory !== 'all' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 text-xs font-medium border border-zinc-200 capitalize">
                      <span>Category: {activeCategory}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 text-xs font-medium border border-zinc-200">
                      <span>Category: All</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-xs text-rose-600 hover:underline font-semibold ml-2 cursor-pointer"
                  >
                    Clear filters
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="appearance-none pl-8 pr-8 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-800 shadow-2xs focus:outline-none focus:border-zinc-900 cursor-pointer"
                  >
                    <option value="newest">Sort: Newest Arrivals</option>
                    <option value="price_asc">Sort: Price (Low to High)</option>
                    <option value="price_desc">Sort: Price (High to Low)</option>
                    <option value="rating">Sort: Top Rated</option>
                  </select>
                  <ArrowUpDown className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {['all', ...(dynamicCategories.length > 0 ? dynamicCategories : ['smartphones', 'laptops', 'audio', 'electronics', 'fashion', 'home', 'beauty', 'sports'])].map((cat) => {
                const isActive = activeCategory === cat;
                const label = cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-zinc-950 text-white shadow-xs'
                        : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
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
              <div className="py-16 text-center bg-white rounded-2xl border border-zinc-200/80 p-8 space-y-4 max-w-md mx-auto my-8">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">
                  No matching products found
                </h3>
                <p className="text-xs text-zinc-500">
                  Try adjusting your search query or selecting a different category filter.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  Reset Search Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
                {products.map((product, idx) => renderProductCard(product, idx))}
              </div>
            )}
          </div>
        ) : (
          /* Home Page: Curated 4-Product Category Showcases (2x2 / 4-card grid per category) */
          <div className="space-y-12">
            {loading ? (
              <div className="space-y-8">
                {[1, 2].map((group) => (
                  <div key={group} className="space-y-4">
                    <div className="h-6 bg-zinc-100 rounded-md w-48 animate-pulse" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="bg-white rounded-2xl border border-zinc-200/80 p-4 space-y-3 animate-pulse"
                        >
                          <div className="w-full aspect-square bg-zinc-100 rounded-xl" />
                          <div className="h-4 bg-zinc-100 rounded-md w-3/4" />
                          <div className="h-3 bg-zinc-100 rounded-md w-1/2" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {HOME_CATEGORY_SECTIONS.map((cat) => {
                  const catProducts = products
                    .filter((p) => p.category?.toLowerCase() === cat.id)
                    .slice(0, 4);

                  if (catProducts.length === 0) return null;

                  return (
                    <section key={cat.id} className="space-y-4">
                      <div className="reveal-on-scroll flex items-end justify-between border-b border-zinc-200/80 pb-3">
                        <div>
                          <h2 className="text-xl font-extrabold text-zinc-950 tracking-tight">
                            {cat.title}
                          </h2>
                          <p className="text-xs text-zinc-500">
                            {cat.subtitle}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCategorySelect(cat.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900 hover:text-zinc-600 transition-colors cursor-pointer group"
                        >
                          <span>See more in {cat.title.split(' ')[0]}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                        {catProducts.map((product, idx) => renderProductCard(product, idx))}
                      </div>
                    </section>
                  );
                })}

                {/* If total products is 0 or all categories are empty */}
                {products.length === 0 && (
                  <div className="py-16 text-center bg-white rounded-2xl border border-zinc-200/80 p-8 space-y-4 max-w-md mx-auto my-8">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                      <Package className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-900">
                      Catalog is currently refreshing
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Our merchants are actively updating product listings. Check back soon!
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-3xl border border-zinc-200 max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                  {selectedProduct.category}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-zinc-500 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{selectedProduct.companyName}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              {/* Photo Showcase */}
              {(() => {
                const photos =
                  selectedProduct.images && selectedProduct.images.length > 0
                    ? selectedProduct.images
                    : [selectedProduct.image];
                const activePhoto = photos[modalImageIndex] || photos[0] || selectedProduct.image;

                return (
                  <div className="space-y-3">
                    <div className="relative aspect-square rounded-2xl bg-zinc-100 overflow-hidden border border-zinc-200 group">
                      <img
                        src={activePhoto}
                        alt={selectedProduct.title}
                        className="w-full h-full object-contain p-2"
                      />

                      {photos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setModalImageIndex((idx) => (idx === 0 ? photos.length - 1 : idx - 1))
                            }
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-zinc-900 border border-zinc-200 shadow-sm flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Previous Photo"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setModalImageIndex((idx) => (idx === photos.length - 1 ? 0 : idx + 1))
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-zinc-900 border border-zinc-200 shadow-sm flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Next Photo"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-zinc-950/80 text-white text-[9px] font-bold">
                            {modalImageIndex + 1} / {photos.length}
                          </span>
                        </>
                      )}
                    </div>

                    {photos.length > 1 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {photos.map((pUrl, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setModalImageIndex(pIdx)}
                            className={`w-12 h-12 rounded-lg border-2 overflow-hidden bg-white p-0.5 shrink-0 cursor-pointer transition-all ${
                              modalImageIndex === pIdx
                                ? 'border-zinc-950 shadow-xs'
                                : 'border-zinc-200 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={pUrl} alt="" className="w-full h-full object-contain" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-zinc-950 leading-tight">
                  {selectedProduct.title}
                </h3>

                <div className="flex items-center gap-2">
                  <div className="text-2xl font-extrabold text-zinc-950">
                    ${selectedProduct.price.toFixed(2)}
                  </div>
                  {(selectedProduct.numReviews || 0) > 0 ? (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{selectedProduct.rating}</span>
                      <span className="text-zinc-400 font-normal">({selectedProduct.numReviews} reviews)</span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400 font-medium">No reviews yet</span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Description
                  </span>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Technical Specifications Summary in Quick View */}
                {selectedProduct.specifications && selectedProduct.specifications.length > 0 && (
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1 font-bold text-[11px] text-zinc-800 uppercase tracking-wider">
                      <Sliders className="w-3 h-3 text-indigo-600" />
                      <span>Key Technical Specifications</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {selectedProduct.specifications.slice(0, 4).map((spec, sIdx) => (
                        <div key={sIdx} className="bg-white p-1.5 rounded-lg border border-zinc-200 shadow-2xs truncate">
                          <span className="text-zinc-400 font-medium block text-[9px] uppercase tracking-wider">{spec.key}</span>
                          <span className="font-bold text-zinc-900 truncate">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-medium">Availability</span>
                  {selectedProduct.stock > 0 ? (
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{selectedProduct.stock} units available</span>
                    </span>
                  ) : (
                    <span className="font-semibold text-rose-600 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Out of Stock</span>
                    </span>
                  )}
                </div>

                {selectedProduct.stock > 0 && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-medium text-zinc-600">Quantity</span>
                    <div className="flex items-center border border-zinc-200 rounded-xl bg-zinc-50 overflow-hidden">
                      <button
                        type="button"
                        disabled={modalQuantity <= 1}
                        onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                        className="p-1.5 text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold font-mono text-zinc-950">
                        {modalQuantity}
                      </span>
                      <button
                        type="button"
                        disabled={modalQuantity >= selectedProduct.stock}
                        onClick={() => setModalQuantity((q) => Math.min(selectedProduct.stock, q + 1))}
                        className="p-1.5 text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    disabled={selectedProduct.stock === 0 || addingId === selectedProduct._id}
                    onClick={async () => {
                      setAddingId(selectedProduct._id);
                      await addToCart({
                        productId: selectedProduct._id,
                        title: selectedProduct.title,
                        price: selectedProduct.price,
                        image: selectedProduct.image,
                        category: selectedProduct.category,
                        companyName: selectedProduct.companyName,
                        stock: selectedProduct.stock,
                        quantity: modalQuantity,
                      }, true);
                      setAddingId(null);
                      setSelectedProduct(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {selectedProduct.stock === 0
                        ? 'Out of Stock'
                        : addingId === selectedProduct._id
                        ? 'Adding to Cart...'
                        : `Add to Cart • $${(selectedProduct.price * modalQuantity).toFixed(2)}`}
                    </span>
                  </button>

                  <Link
                    to={`/product/${selectedProduct._id}`}
                    onClick={() => setSelectedProduct(null)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View Full Product Page & All Photos</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="pt-2 text-center">
                  <Link
                    to={`/product/${selectedProduct._id}`}
                    onClick={() => setSelectedProduct(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <span>View Dedicated Product Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
