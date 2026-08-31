import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Star,
  Building2,
  Package,
  X,
  ShoppingBag,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flame,
  ArrowRight,
  Plus,
  Minus,
} from 'lucide-react';
import { getProductsApi } from '../services/productService';
import { useCart } from '../context/CartContext';
import type { Product } from '../types/product';

const BANNERS = [
  {
    id: 1,
    title: 'The Future of Connectivity',
    subtitle: 'Next-Gen Audio & Computing Essentials',
    category: 'electronics',
    badge: 'Flagship Tech 2026',
    image: '/banners/tech_banner.jpg',
    cta: 'Explore Tech Catalog',
    accentColor: 'from-violet-600/80 via-indigo-900/60 to-transparent',
  },
  {
    id: 2,
    title: 'Modern Luxe & Streetwear',
    subtitle: 'Curated Autumn Cashmere & Outerwear',
    category: 'fashion',
    badge: 'Designer Collection',
    image: '/banners/fashion_banner.jpg',
    cta: 'Shop Designer Fashion',
    accentColor: 'from-amber-950/80 via-zinc-900/60 to-transparent',
  },
  {
    id: 3,
    title: 'Architectural Smart Living',
    subtitle: 'Minimalist Scandinavian Craftsmanship & Ambient Audio',
    category: 'home',
    badge: 'Home & Living',
    image: '/banners/home_banner.jpg',
    cta: 'Discover Home Essentials',
    accentColor: 'from-emerald-950/80 via-stone-900/60 to-transparent',
  },
];

const CATEGORY_CARDS = [
  {
    id: 'electronics',
    title: 'Electronics',
    tagline: 'Audio, Laptops & Gear',
    image: '/banners/tech_banner.jpg',
  },
  {
    id: 'fashion',
    title: 'Fashion & Apparel',
    tagline: 'Luxury Outerwear & Shoes',
    image: '/banners/fashion_banner.jpg',
  },
  {
    id: 'home',
    title: 'Home & Living',
    tagline: 'Minimalist Living Spaces',
    image: '/banners/home_banner.jpg',
  },
  {
    id: 'beauty',
    title: 'Beauty & Skincare',
    tagline: 'Botanical Essentials',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
  },
];

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const activeCategory = searchParams.get('category') || 'all';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc' | 'rating'>('newest');
  const [totalCount, setTotalCount] = useState(0);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [addingId, setAddingId] = useState<string | null>(null);

  const { addToCart } = useCart();

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

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

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProductsApi({
        search: search.trim() || undefined,
        category: activeCategory !== 'all' ? activeCategory : undefined,
        sort,
        limit: 24,
      });
      setProducts(data.products || []);
      setTotalCount(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategorySelect = (cat: string) => {
    const params = new URLSearchParams(searchParams);
    if (cat === 'all') {
      params.delete('category');
    } else {
      params.set('category', cat);
    }
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSuccess(true);
      setNewsletterEmail('');
      setTimeout(() => setNewsletterSuccess(false), 4000);
    }
  };

  const activeBanner = BANNERS[currentSlide];

  return (
    <div className="min-h-screen bg-zinc-50/60 text-zinc-900 flex flex-col font-sans">
      {!search && activeCategory === 'all' && (
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
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${banner.accentColor}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
              </div>
            );
          })}

          <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
            <div
              className="max-w-2xl space-y-4 transition-transform duration-500 will-change-transform"
              style={{
                transform: `translate(${mousePos.x * -0.6}px, ${mousePos.y * -0.6}px)`,
              }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg animate-in fade-in duration-300">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{activeBanner.badge}</span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span className="text-[11px] text-zinc-300 font-mono">FLASH DEALS 2026</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                {activeBanner.title}
              </h1>

              <p className="text-sm sm:text-lg text-zinc-200 font-medium max-w-lg leading-relaxed drop-shadow">
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
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-zinc-950/40 hover:bg-zinc-900/80 text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer hidden sm:flex items-center justify-center"
            title="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % BANNERS.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-zinc-950/40 hover:bg-zinc-900/80 text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer hidden sm:flex items-center justify-center"
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
      )}

      {!search && activeCategory === 'all' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-zinc-950 tracking-tight">
                Curated Collections
              </h2>
              <p className="text-xs text-zinc-500">
                Explore top departments across our marketplace catalog
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORY_CARDS.map((card) => (
              <div
                key={card.id}
                onClick={() => handleCategorySelect(card.id)}
                className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-2xs hover:shadow-lg transition-all duration-300 border border-zinc-200/80"
              >
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                    Collection
                  </span>
                  <h3 className="text-sm font-bold leading-tight drop-shadow">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-zinc-300 mt-0.5 line-clamp-1">
                    {card.tagline}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-zinc-950 tracking-tight">
                {search
                  ? `Search results for "${search}"`
                  : activeCategory === 'all'
                  ? 'All Marketplace Products'
                  : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                {totalCount} items
              </span>
            </div>
            {(search || activeCategory !== 'all') && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-zinc-500">Active filters:</span>
                {search && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200">
                    <span>Keyword: {search}</span>
                  </span>
                )}
                {activeCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200 capitalize">
                    <span>Category: {activeCategory}</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs text-rose-600 hover:underline font-semibold ml-2 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
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

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-4 scrollbar-none">
          {['all', 'electronics', 'fashion', 'home', 'beauty', 'sports'].map((cat) => {
            const isActive = activeCategory === cat;
            const label = cat === 'all' ? 'All Products' : cat.charAt(0).toUpperCase() + cat.slice(1);
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

        {error && (
          <div className="p-4 my-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-6">
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
              No products found
            </h3>
            <p className="text-xs text-zinc-500">
              {search || activeCategory !== 'all'
                ? 'Try adjusting your search query or selecting a different category pill.'
                : 'No products are currently available in the marketplace catalog.'}
            </p>
            {(search || activeCategory !== 'all') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                Reset Search Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-6">
            {products.map((product) => (
              <div
                key={product._id}
                onClick={() => setSelectedProduct(product)}
                className="group bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-2xs hover:shadow-lg hover:border-zinc-300 transition-all duration-200 flex flex-col justify-between cursor-pointer"
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
                      <Building2 className="w-3 h-3 text-indigo-500" />
                      <span className="truncate font-medium text-zinc-600">
                        {product.companyName}
                      </span>
                    </div>

                    <h2 className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {product.title}
                    </h2>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-base font-extrabold text-zinc-950">
                      ${product.price.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{product.rating}</span>
                      <span className="text-zinc-400">({product.numReviews})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product);
                        setModalQuantity(1);
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      disabled={product.stock === 0 || addingId === product._id}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setAddingId(product._id);
                        await addToCart({
                          productId: product._id,
                          title: product.title,
                          price: product.price,
                          image: product.image,
                          category: product.category,
                          companyName: product.companyName,
                          stock: product.stock,
                          quantity: 1,
                        }, true);
                        setAddingId(null);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 rounded-lg transition-all active:scale-95 shadow-2xs cursor-pointer"
                      title="Quick Add to Cart"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white text-zinc-600 text-xs border-t border-zinc-200/80 pt-14 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-base font-extrabold text-zinc-950 tracking-tight">
                  NovaCommerce
                </span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
                A sleek, modern marketplace designed for seamless retail shopping, verified merchant catalogs, and instant global fulfillment.
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                Departments
              </span>
              <ul className="space-y-2 text-[11px]">
                <li>
                  <button
                    type="button"
                    onClick={() => handleCategorySelect('electronics')}
                    className="hover:text-zinc-950 transition-colors cursor-pointer"
                  >
                    Consumer Electronics
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleCategorySelect('fashion')}
                    className="hover:text-zinc-950 transition-colors cursor-pointer"
                  >
                    Fashion & Apparel
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleCategorySelect('home')}
                    className="hover:text-zinc-950 transition-colors cursor-pointer"
                  >
                    Home & Living
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleCategorySelect('beauty')}
                    className="hover:text-zinc-950 transition-colors cursor-pointer"
                  >
                    Beauty & Skincare
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleCategorySelect('sports')}
                    className="hover:text-zinc-950 transition-colors cursor-pointer"
                  >
                    Sports & Outdoors
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                Customer Care
              </span>
              <ul className="space-y-2 text-[11px]">
                <li><span className="hover:text-zinc-950 transition-colors cursor-pointer">Track Your Order</span></li>
                <li><span className="hover:text-zinc-950 transition-colors cursor-pointer">Shipping & Delivery Rates</span></li>
                <li><span className="hover:text-zinc-950 transition-colors cursor-pointer">30-Day Returns & Exchanges</span></li>
                <li><span className="hover:text-zinc-950 transition-colors cursor-pointer">Buyer Protection Escrow</span></li>
                <li><span className="hover:text-zinc-950 transition-colors cursor-pointer">24/7 Priority Assistance</span></li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                Stay Updated
              </span>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Subscribe for exclusive flash deals, new designer arrivals, and catalog promotions.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex">
                <input
                  type="email"
                  placeholder="Enter your email..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                  className="flex-1 min-w-0 px-3 py-2 rounded-l-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-r-xl font-semibold text-xs transition-colors cursor-pointer shrink-0"
                >
                  Subscribe
                </button>
              </form>
              {newsletterSuccess && (
                <p className="text-[11px] text-emerald-600 font-medium animate-in fade-in">
                  Thank you for subscribing to NovaCommerce deals!
                </p>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-400">
            <div>
              &copy; {new Date().getFullYear()} NovaCommerce Platform. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <span className="hover:text-zinc-700 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-zinc-700 cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-zinc-700 cursor-pointer transition-colors">Security & Trust</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>System Operational</span>
              </span>
            </div>
          </div>
        </div>
      </footer>

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
              <div className="aspect-square rounded-2xl bg-zinc-100 overflow-hidden border border-zinc-100">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-zinc-950 leading-tight">
                  {selectedProduct.title}
                </h3>

                <div className="flex items-center gap-2">
                  <div className="text-2xl font-extrabold text-zinc-950">
                    ${selectedProduct.price.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{selectedProduct.rating}</span>
                    <span className="text-zinc-400 font-normal">({selectedProduct.numReviews} reviews)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Description
                  </span>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                </div>

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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
