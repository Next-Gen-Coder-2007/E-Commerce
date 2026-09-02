import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, ShoppingBag, Flame } from 'lucide-react';
import { getForYouRecommendationsApi, RecommendedProduct } from '../../services/recommendationService';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';

export const ForYouRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const { wishlist, addItem, isInWishlist } = useWishlist();
  const { cart, addToCart } = useCart();

  useEffect(() => {
    const fetchRecs = async () => {
      setLoading(true);
      try {
        const wishlistIds = wishlist?.items?.map((i) => i.productId) || [];
        const cartIds = cart?.items?.map((i) => i.productId) || [];
        const categories = wishlist?.items?.map((i) => i.category).filter(Boolean) as string[] || [];

        const recs = await getForYouRecommendationsApi({
          wishlist: wishlistIds,
          cart: cartIds,
          categories: Array.from(new Set(categories)),
          limit: 6,
        });
        setRecommendations(recs);
      } catch (err) {
        console.error('Failed to load personalized recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecs();
  }, [wishlist?.totalItems, cart?.items?.length]);

  if (loading) {
    return (
      <div className="my-10 p-6 bg-white rounded-3xl border border-zinc-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 animate-spin" />
          <span className="text-xs text-zinc-500 font-medium">Synthesizing personalized recommendations...</span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <section className="my-12 rounded-3xl bg-white border border-zinc-200/80 p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>AI Intent Recommendations</span>
          </div>
          <h2 className="text-2xl font-black text-zinc-950 tracking-tight">
            Recommended For You
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Tailored in real-time based on your Wishlist intent, browsing affinity, and curated taste.
          </p>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {recommendations.map((p) => {
          const inWish = isInWishlist(p._id);
          return (
            <div
              key={p._id}
              className="group bg-white hover:bg-zinc-50/50 border border-zinc-200/80 hover:border-zinc-300 rounded-3xl p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-lg relative"
            >
              {/* Match Reason Tag */}
              {p.matchReason && (
                <div className="absolute top-2 left-2 z-10 max-w-[85%]">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[9px] truncate shadow-2xs">
                    <Flame className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                    <span className="truncate">{p.matchReason}</span>
                  </span>
                </div>
              )}

              {/* Wishlist Heart Action */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  addItem({
                    productId: p._id,
                    title: p.title,
                    price: p.price,
                    image: p.image,
                    category: p.category,
                    companyId: p.companyId,
                    companyName: p.companyName,
                  });
                }}
                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:scale-110 transition shadow-2xs cursor-pointer"
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    inWish ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'
                  }`}
                />
              </button>

              <Link to={`/product/${p._id}`} className="block">
                <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-100 mb-2 relative">
                  <img
                    src={p.image || 'https://via.placeholder.com/200'}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">
                  {p.category}
                </div>
                <h3 className="text-xs font-bold text-zinc-900 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                  {p.title}
                </h3>
              </Link>

              <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-black text-zinc-950">
                    ${p.price.toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    addToCart({
                      productId: p._id,
                      title: p.title,
                      price: p.price,
                      image: p.image,
                      quantity: 1,
                      category: p.category,
                    })
                  }
                  className="w-7 h-7 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white flex items-center justify-center shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer"
                  title="Add to Cart"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ForYouRecommendations;
