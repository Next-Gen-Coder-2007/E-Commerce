import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Percent, ArrowRight, Tag } from 'lucide-react';
import { getProductsApi } from '../services/productService';
import { ProductCard } from '../components/ProductCard';
import type { Product } from '../types/product';

export const DealsPage: React.FC = () => {
  const [dealProducts, setDealProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Deals Hero Header */}
      <div className="rounded-2xl bg-white border border-zinc-200/80 p-6 sm:p-10 shadow-xs">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
            <Tag className="w-3.5 h-3.5 text-zinc-700" />
            <span>Marketplace Promotions</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-950">
            Limited-Time Deals & Special Offers
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
            Discover verified markdowns across all departments. Apply promo coupons at checkout for additional savings.
          </p>
        </div>
      </div>

      {/* Verified Promo Coupons Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-zinc-700" />
          <h2 className="text-lg font-bold text-zinc-950 tracking-tight">Active Coupons</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { code: 'NOVA10', discount: '10% OFF', desc: 'Valid sitewide on all orders with zero minimum spend', min: '$0 minimum' },
            { code: 'SPRING20', discount: '20% OFF', desc: 'Seasonal discount on orders over $150', min: '$150 minimum' },
            { code: 'FREESHIP', discount: 'FREE DELIVERY', desc: 'Complimentary expedited courier delivery', min: '$50 minimum' },
          ].map((c) => (
            <div
              key={c.code}
              className="p-5 bg-white border border-zinc-200/80 rounded-2xl flex flex-col justify-between space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-base text-zinc-950 tracking-wider">
                  {c.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-800">
                  {c.discount}
                </span>
              </div>
              <p className="text-xs text-zinc-500">{c.desc}</p>
              <div className="text-[11px] text-zinc-400 font-medium">{c.min}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Discounted Product Showcase using unified ProductCard */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-950 tracking-tight">Featured On-Sale Items</h2>
            <p className="text-xs text-zinc-500">Curated promotional items updated daily</p>
          </div>
          <Link
            to="/"
            className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 flex items-center gap-1 transition"
          >
            <span>View all products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-zinc-200/80 p-3.5 space-y-3 animate-pulse">
                <div className="aspect-square bg-zinc-100 rounded-xl" />
                <div className="h-4 bg-zinc-100 rounded-md w-3/4" />
                <div className="h-3 bg-zinc-100 rounded-md w-1/2" />
                <div className="h-8 bg-zinc-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : dealProducts.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-zinc-200 rounded-2xl p-8 space-y-2">
            <p className="text-sm font-semibold text-zinc-800">No active promotional items at the moment</p>
            <p className="text-xs text-zinc-500">Check back soon for new sales and marketplace drops.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {dealProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DealsPage;
