import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Percent, ArrowRight, Tag, Sparkles, Copy, Check } from 'lucide-react';
import { getProductsApi } from '../services/productService';
import { ProductCard } from '../components/ProductCard';
import { RawAtmosphere } from '../components/RawAtmosphere';
import type { Product } from '../types/product';

export const DealsPage: React.FC = () => {
  const [dealProducts, setDealProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getProductsApi({ limit: 24 })
      .then((prodRes) => {
        const discounted = (prodRes.products || []).filter(
          (p) =>
            (p.discountPercentage && p.discountPercentage > 0) ||
            (p.originalPrice && p.originalPrice > p.price)
        );
        setDealProducts(discounted.length > 0 ? discounted : (prodRes.products || []).slice(0, 12));
      })
      .catch((err) => console.warn('Deals load error:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto space-y-12 font-satoshi text-[#1E1E1E] relative">
      <RawAtmosphere variant="subtle" />

      {/* Hero Header */}
      <div className="bg-[#1E1E1E] text-[#E4E2DD] border-2 border-[#1E1E1E] p-8 sm:p-14 relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#DB4A2B] text-[#FFFFFF] text-[10px] font-mono font-bold uppercase tracking-widest">
            <Tag className="w-3.5 h-3.5" />
            <span>SPECIAL PROMOTIONS & PRIVILEGES</span>
          </div>
          <h1 className="font-clash text-4xl sm:text-6xl font-bold uppercase tracking-[-0.05em] text-[#FFFFFF] leading-none">
            LIMITED-TIME MARKDOWNS
          </h1>
          <p className="text-xs sm:text-sm text-[#E4E2DD]/70 leading-relaxed max-w-xl">
            Verified price cuts across seasonal departments. Combine promotional codes at checkout for instant additional deductions.
          </p>
        </div>
      </div>

      {/* Active Promo Coupons Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-[#1E1E1E] pb-3">
          <Percent className="w-4 h-4 text-[#DB4A2B]" />
          <h2 className="font-clash text-xl font-bold uppercase tracking-tight text-[#1E1E1E]">
            ACTIVE VOUCHER PRIVILEGES
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { code: 'NOVA10', discount: '10% OFF', desc: 'Valid sitewide on all orders with zero minimum spend requirement', min: '$0 MINIMUM' },
            { code: 'SPRING20', discount: '20% OFF', desc: 'Seasonal promotional markdown on orders exceeding $150 total', min: '$150 MINIMUM' },
            { code: 'FREESHIP', discount: 'FREE DELIVERY', desc: 'Complimentary express courier delivery on qualifying baskets', min: '$50 MINIMUM' },
          ].map((c) => (
            <div
              key={c.code}
              className="p-6 bg-[#FFFFFF] border-2 border-[#1E1E1E] flex flex-col justify-between space-y-4 group hover:border-[#DB4A2B] transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-lg text-[#1E1E1E] tracking-wider">
                  {c.code}
                </span>
                <span className="px-2.5 py-1 bg-[#1E1E1E] text-[#E4E2DD] text-[10px] font-mono font-bold uppercase">
                  {c.discount}
                </span>
              </div>
              <p className="text-xs text-[#444444] leading-relaxed">{c.desc}</p>
              <div className="pt-2 border-t border-[#1E1E1E]/15 flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#444444]">{c.min}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(c.code)}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#1E1E1E] hover:text-[#DB4A2B] cursor-pointer"
                >
                  {copiedCode === c.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>COPY</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Promotional Products Showcase (Strict 3 Columns Desktop) */}
      <div className="space-y-6">
        <div className="flex items-end justify-between border-b-2 border-[#1E1E1E] pb-3">
          <div>
            <h2 className="font-clash text-2xl font-bold uppercase tracking-tight text-[#1E1E1E]">
              FEATURED PROMOTIONAL DROPS
            </h2>
            <p className="text-xs text-[#444444] font-mono uppercase mt-0.5">CURATED MARKDOWNS UPDATED DAILY</p>
          </div>
          <Link
            to="/"
            className="font-mono text-xs font-bold uppercase tracking-wider text-[#1E1E1E] hover:text-[#DB4A2B] flex items-center gap-1.5 transition"
          >
            <span>FULL CATALOG</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#FFFFFF] border border-[#1E1E1E]/20 p-4 space-y-3 animate-pulse">
                <div className="aspect-[3/4] bg-[#E4E2DD]" />
                <div className="h-4 bg-[#E4E2DD] w-3/4" />
                <div className="h-3 bg-[#E4E2DD] w-1/2" />
              </div>
            ))}
          </div>
        ) : dealProducts.length === 0 ? (
          <div className="text-center py-20 bg-[#FFFFFF] border-2 border-[#1E1E1E] p-8 space-y-2">
            <p className="font-clash text-base font-bold text-[#1E1E1E] uppercase">NO ACTIVE PROMOTIONAL ITEMS FOUND</p>
            <p className="text-xs text-[#444444]">Check back soon for new seasonal archive drops.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dealProducts.map((product, idx) => (
              <ProductCard key={product._id} product={product} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DealsPage;
