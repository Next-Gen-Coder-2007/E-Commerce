import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Percent } from 'lucide-react';
import { getProductsApi } from '../services/productService';
import type { Product } from '../types/product';

export const DealsPage: React.FC = () => {
  const [dealProducts, setDealProducts] = useState<Product[]>([]);

  useEffect(() => {
    getProductsApi({ limit: 20 })
      .then((prodRes) => {
        const discounted = (prodRes.products || []).filter(
          (p) =>
            (p.discountPercentage && p.discountPercentage > 0) ||
            (p.originalPrice && p.originalPrice > p.price)
        );
        setDealProducts(discounted.length > 0 ? discounted : (prodRes.products || []).slice(0, 8));
      })
      .catch((err) => console.warn('Deals load error:', err));
  }, []);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Deals Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-linear-to-r from-red-600 via-rose-600 to-amber-600 text-white p-8 sm:p-12 shadow-2xl shadow-rose-950/20">
        <div className="max-w-2xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Limited-Time Marketplace Drops</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Flash Deals & Mega Promotional Savings
          </h1>
          <p className="text-rose-100 text-xs sm:text-sm leading-relaxed">
            Up to 30% off top-tier tech, fashion essentials, and lifestyle gear. Combine with verified promo coupons at checkout.
          </p>
        </div>
      </div>

      {/* Verified Promo Coupons Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Percent className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-black text-zinc-900 tracking-tight">Active Platform Coupons</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { code: 'NOVA10', discount: '10% OFF', desc: 'Valid sitewide on all orders with zero minimum spend', min: '$0' },
            { code: 'SPRING20', discount: '20% OFF', desc: 'Mega discount on orders over $150', min: '$150' },
            { code: 'FREESHIP', discount: 'FREE DELIVERY', desc: 'Complimentary expedited courier delivery', min: '$50' },
          ].map((c) => (
            <div
              key={c.code}
              className="p-5 bg-white border border-dashed border-indigo-300 rounded-2xl flex flex-col justify-between space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-lg text-indigo-600 tracking-wider">
                  {c.code}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                  {c.discount}
                </span>
              </div>
              <p className="text-xs text-zinc-500">{c.desc}</p>
              <div className="text-[10px] text-zinc-400 font-medium">Min spend: {c.min}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Discounted Product Showcase */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-600" />
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">Featured On-Sale Items</h2>
          </div>
          <Link to="/" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
            View All Products &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {dealProducts.map((p) => (
            <div
              key={p._id}
              className="bg-white rounded-3xl border border-zinc-200/80 p-4 space-y-3 shadow-xs hover:shadow-xl hover:border-zinc-300 transition group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="relative aspect-square rounded-2xl bg-zinc-100 overflow-hidden">
                  <img
                    src={p.image || 'https://via.placeholder.com/300'}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {p.discountPercentage && p.discountPercentage > 0 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-black shadow-md">
                      -{p.discountPercentage}%
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-zinc-400">{p.category}</div>
                  <Link
                    to={`/product/${p._id}`}
                    className="font-bold text-zinc-900 text-sm hover:text-indigo-600 transition line-clamp-1 block"
                  >
                    {p.title}
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                <div>
                  <span className="font-mono font-black text-zinc-950 text-base">
                    ${p.price.toFixed(2)}
                  </span>
                  {p.originalPrice && p.originalPrice > p.price ? (
                    <span className="font-mono text-xs text-zinc-400 line-through ml-1.5">
                      ${p.originalPrice.toFixed(2)}
                    </span>
                  ) : null}
                </div>

                <Link
                  to={`/product/${p._id}`}
                  className="px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition"
                >
                  View Deal
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DealsPage;
