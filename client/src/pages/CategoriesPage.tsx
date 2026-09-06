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
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-white border border-zinc-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
              <Layers className="w-3.5 h-3.5 text-zinc-700" />
              <span>Marketplace Taxonomy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              Explore All 24 Departments
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
              Browse authentic items across our curated departments with verified catalog standards and merchant specifications.
            </p>
          </div>

          {/* Search bar inside header */}
          <div className="w-full sm:w-72">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search departments..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-50 text-zinc-900 placeholder-zinc-400 text-xs border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:bg-white transition"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs cursor-pointer p-0.5"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Directory Count Bar */}
      <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
        <div>
          Showing <span className="text-zinc-900 font-semibold">{filteredCategories.length}</span> of 24 departments
        </div>
        {searchQuery && (
          <span className="text-zinc-400">
            Filtering by &ldquo;{searchQuery}&rdquo;
          </span>
        )}
      </div>

      {/* Grid of All 24 Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredCategories.map((cat: TaxonomyCategory) => {
          const Icon = cat.icon;
          const count = counts[cat.id.toLowerCase()] || 0;

          return (
            <div
              key={cat.id}
              className="group bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-2xs hover:border-zinc-300 transition flex flex-col justify-between"
            >
              {/* Card Header & Image */}
              <Link
                to={`/?category=${encodeURIComponent(cat.id)}`}
                className="block relative aspect-16/10 overflow-hidden bg-zinc-100"
              >
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/25 to-transparent flex items-end p-3.5">
                  <div className="flex items-center gap-2.5 text-white">
                    <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-sm tracking-tight leading-snug">
                        {cat.name}
                      </h2>
                      <span className="text-[10px] text-zinc-300">
                        {count > 0 ? `${count} items` : 'Verified catalog'}
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
                  <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                    Popular Subcategories
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub}
                        to={`/?category=${encodeURIComponent(cat.id)}&subcategory=${encodeURIComponent(sub)}`}
                        className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-[10px] font-medium transition"
                      >
                        {sub}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Variants preview pill */}
                <div className="pt-2 border-t border-zinc-100 flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <SlidersHorizontal className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span className="truncate">
                    {cat.attributes.join(' · ')}
                  </span>
                </div>

                {/* View Category Link */}
                <Link
                  to={`/?category=${encodeURIComponent(cat.id)}`}
                  className="flex items-center justify-between text-xs font-semibold pt-1 text-zinc-900 group-hover:text-zinc-700"
                >
                  <span>Browse {cat.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-16 bg-white border border-dashed border-zinc-300 rounded-2xl">
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
