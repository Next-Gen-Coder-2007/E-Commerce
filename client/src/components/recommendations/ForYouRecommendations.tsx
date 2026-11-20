import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
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
      <div className="my-10 p-6 bg-[#FFFFFF] border-2 border-[#1E1E1E] text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-[#1E1E1E] border-t-transparent animate-spin" />
          <span className="uppercase tracking-widest text-[#1E1E1E]">SYNTHESIZING PERSONALIZED ARCHIVE VECTORS...</span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <section className="my-14 bg-[#FFFFFF] border-2 border-[#1E1E1E] p-6 sm:p-10 font-satoshi relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#1E1E1E]/15">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#1E1E1E] text-[#FF89A9] text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI INTENT RADAR</span>
          </div>
          <h2 className="font-clash text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#1E1E1E]">
            CURATED FOR YOUR TASTE
          </h2>
          <p className="text-xs text-[#444444] mt-1 font-mono uppercase tracking-wider">
            TAILORED IN REAL-TIME BASED ON WISHLIST AFFINITY & BROWSING VECTOR TELEMETRY
          </p>
        </div>
        <span className="font-mono text-xs font-bold text-[#DB4A2B] uppercase tracking-wider">
          {recommendations.length} MATCHED SILHOUETTES
        </span>
      </div>

      {/* Product Cards Grid: 3 columns desktop / 2 tablet / 1 mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((p, idx) => (
          <ProductCard key={p._id} product={p} index={idx} />
        ))}
      </div>
    </section>
  );
};

export default ForYouRecommendations;
