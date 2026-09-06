import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { getForYouRecommendationsApi, RecommendedProduct } from '../../services/recommendationService';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { ProductCard } from '../ProductCard';

export const ForYouRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const { wishlist } = useWishlist();
  const { cart } = useCart();

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
      <div className="my-10 p-6 bg-white rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 animate-spin" />
          <span className="text-xs text-zinc-500 font-medium">Synthesizing personalized recommendations...</span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <section className="my-12 rounded-2xl bg-white border border-zinc-200/80 p-6 sm:p-8 shadow-xs">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
        {recommendations.map((p, idx) => (
          <ProductCard key={p._id} product={p} index={idx} />
        ))}
      </div>
    </section>
  );
};

export default ForYouRecommendations;
