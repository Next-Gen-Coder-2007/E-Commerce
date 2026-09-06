import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { getCategoriesApi } from '../services/productService';
import { TAXONOMY_CATEGORIES, TaxonomyCategory } from '../config/taxonomy';

export const CategoriesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    getCategoriesApi()
      .then((res) => {
        if (res.categoryCounts) {
          const map: Record<string, number> = {};
          res.categoryCounts.forEach((c) => {
            map[c.category.toLowerCase()] = c.count;
          });
          setCounts(map);
        }
      })
      .catch((err) => console.warn('Categories fetch error:', err));
  }, []);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return TAXONOMY_CATEGORIES;
    return TAXONOMY_CATEGORIES.filter((cat) => {
      const matchName = cat.name.toLowerCase().includes(q);
      const matchSub = cat.subcategories.some((s) => s.toLowerCase().includes(q));
      const matchAttr = cat.attributes.some((a) => a.toLowerCase().includes(q));
      return matchName || matchSub || matchAttr;
    });
  }, [searchQuery]);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-linear-to-br from-zinc-950 via-zinc-900 to-indigo-950 text-white p-8 sm:p-12 overflow-hidden shadow-xl border border-zinc-800">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-400/30">
            <Layers className="w-3.5 h-3.5" />
            <span>Marketplace Taxonomy & Directory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Explore All 24 Departments
          </h1>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Find authentic merchandise across curated categories, complete with specialized subcategories and configurable variant specifications.
          </p>

          {/* Search bar inside header */}
          <div className="pt-3 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search departments, subcategories or variants..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/10 text-white placeholder-zinc-400 text-xs border border-white/20 focus:outline-none focus:bg-white/20 focus:border-indigo-400 transition shadow-inner"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Directory Count Bar */}
      <div className="flex items-center justify-between text-xs text-zinc-500 border-b border-zinc-200 pb-3">
        <div className="font-semibold text-zinc-800">
          Showing <span className="text-indigo-600 font-bold">{filteredCategories.length}</span> of 24 departments
        </div>
        {searchQuery && (
          <span className="text-zinc-400">
            Filtering by &ldquo;{searchQuery}&rdquo;
          </span>
        )}
      </div>

      {/* Grid of All 24 Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCategories.map((cat: TaxonomyCategory) => {
          const Icon = cat.icon;
          const count = counts[cat.id.toLowerCase()] || 0;

          return (
            <div
              key={cat.id}
              className="group bg-white rounded-3xl border border-zinc-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-zinc-300 transition-all flex flex-col justify-between"
            >
              {/* Card Header & Image */}
              <Link
                to={`/?category=${encodeURIComponent(cat.id)}`}
                className="block relative aspect-16/10 overflow-hidden bg-zinc-100"
              >
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-zinc-950/85 via-zinc-950/30 to-transparent flex items-end p-4">
                  <div className="flex items-center gap-2.5 text-white">
                    <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="font-black text-sm tracking-tight leading-snug">
                        {cat.name}
                      </h2>
                      <span className="text-[10px] text-zinc-300 font-medium">
                        {count > 0 ? `${count} items in catalog` : 'Catalog verified'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                  {cat.desc}
                </p>

                {/* Subcategory interactive chips */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Popular Subcategories
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub}
                        to={`/?category=${encodeURIComponent(cat.id)}&subcategory=${encodeURIComponent(sub)}`}
                        className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-600 text-zinc-600 text-[10px] font-medium transition"
                      >
                        {sub}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Variants preview pill */}
                <div className="pt-2 border-t border-zinc-100 flex items-center gap-1 text-[10px] text-zinc-400">
                  <SlidersHorizontal className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span className="truncate">
                    {cat.attributes.join(' · ')}
                  </span>
                </div>

                {/* View Category Link */}
                <Link
                  to={`/?category=${encodeURIComponent(cat.id)}`}
                  className="flex items-center justify-between text-xs font-bold pt-2 text-indigo-600 group-hover:text-indigo-700"
                >
                  <span>Browse {cat.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-16 bg-white border border-dashed border-zinc-300 rounded-3xl">
          <p className="text-sm font-bold text-zinc-800">No departments match &ldquo;{searchQuery}&rdquo;</p>
          <p className="text-xs text-zinc-500 mt-1">Try searching by category name, subcategory or variant attribute.</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-4 px-4 py-2 rounded-xl bg-zinc-950 text-white font-bold text-xs cursor-pointer"
          >
            Clear Search Filter
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
