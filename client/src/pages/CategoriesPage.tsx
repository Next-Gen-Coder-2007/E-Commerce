import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Smartphone,
  Laptop,
  Headphones,
  Tv,
  Shirt,
  Home,
  Sparkles,
  Dumbbell,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { getCategoriesApi } from '../services/productService';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    getCategoriesApi()
      .then((res) => {
        if (res.categories) setCategories(res.categories);
        if (res.categoryCounts) {
          const map: Record<string, number> = {};
          res.categoryCounts.forEach((c) => {
            map[c.category] = c.count;
          });
          setCounts(map);
        }
      })
      .catch((err) => console.warn('Categories fetch error:', err));
  }, []);

  const categoryMeta: Record<string, { icon: any; desc: string; img: string }> = {
    smartphones: {
      icon: Smartphone,
      desc: 'Flagship 5G devices, titanium builds & pro camera systems',
      img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
    },
    laptops: {
      icon: Laptop,
      desc: 'High-performance workstations, OLED displays & ultrabooks',
      img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80',
    },
    audio: {
      icon: Headphones,
      desc: 'Studio reference monitors, ANC headphones & spatial earbuds',
      img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    },
    electronics: {
      icon: Tv,
      desc: 'Smart wearables, mirrorless 4K cameras & productivity mice',
      img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
    },
    fashion: {
      icon: Shirt,
      desc: 'Designer apparel, vintage sneakers & streetwear drops',
      img: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&q=80',
    },
    home: {
      icon: Home,
      desc: 'Ergonomic seating, smart appliances & architectural decor',
      img: 'https://images.unsplash.com/photo-1580481077195-c990b790d238?w=600&q=80',
    },
    beauty: {
      icon: Sparkles,
      desc: 'Luxury skincare formulations, restorative creams & essences',
      img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
    },
    sports: {
      icon: Dumbbell,
      desc: 'Multisport solar GPS smartwatches & training gear',
      img: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&q=80',
    },
  };

  const list = categories.length > 0 ? categories : Object.keys(categoryMeta);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          <span>Marketplace Directory</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 mt-1">
          Browse by Category
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Explore curated departments featuring verified authentic products and merchant stores.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {list.map((catKey) => {
          const meta = categoryMeta[catKey.toLowerCase()] || {
            icon: Layers,
            desc: 'Explore quality products in this collection',
            img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
          };
          const Icon = meta.icon;
          const count = counts[catKey] || 12;

          return (
            <Link
              key={catKey}
              to={`/?category=${encodeURIComponent(catKey.toLowerCase())}`}
              className="group bg-white rounded-3xl border border-zinc-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-zinc-300 transition flex flex-col justify-between"
            >
              <div className="aspect-4/3 overflow-hidden bg-zinc-100 relative">
                <img
                  src={meta.img}
                  alt={catKey}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-linear-to-t from-zinc-950/80 via-transparent to-transparent flex items-end p-4">
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-base capitalize tracking-tight">
                      {catKey}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-xs text-zinc-500 leading-relaxed">{meta.desc}</p>
                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-zinc-100 text-indigo-600 group-hover:text-indigo-700">
                  <span>{count} products available</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default CategoriesPage;
