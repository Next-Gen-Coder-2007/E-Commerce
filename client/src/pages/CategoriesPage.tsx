import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import { getCategoriesApi } from '../services/productService';
import { TAXONOMY_CATEGORIES, TaxonomyCategory } from '../config/taxonomy';
import { RawAtmosphere } from '../components/RawAtmosphere';

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
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto space-y-10 font-satoshi text-[#1E1E1E] relative">
      <RawAtmosphere variant="subtle" />

      {/* Header Poster Banner */}
      <div className="bg-[#FFFFFF] border-2 border-[#1E1E1E] p-8 sm:p-12 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1E1E1E] text-[#FF89A9] text-[10px] font-mono font-bold uppercase tracking-widest">
              <Layers className="w-3.5 h-3.5" />
              <span>MARKETPLACE TAXONOMY ARCHITECTURE</span>
            </div>
            <h1 className="font-clash text-4xl sm:text-6xl font-bold uppercase tracking-[-0.05em] text-[#1E1E1E] leading-none">
              ALL 24 DEPARTMENTS
            </h1>
            <p className="text-xs sm:text-sm text-[#444444] leading-relaxed">
              Explore authentic merchandise across our standardized taxonomy. Each department maintains discrete attributes, specifications, and verified supplier certifications.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full lg:w-80">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH DEPARTMENTS..."
                className="w-full pl-9 pr-8 py-3 bg-[#E4E2DD]/40 border border-[#1E1E1E] text-xs font-mono uppercase tracking-wider text-[#1E1E1E] placeholder-[#444444]/60 focus:outline-none focus:bg-[#FFFFFF]"
              />
              <Search className="w-4 h-4 text-[#1E1E1E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#444444] hover:text-[#DB4A2B] text-xs cursor-pointer p-0.5"
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
      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#444444] px-1 border-b border-[#1E1E1E]/20 pb-3">
        <div>
          SHOWING <span className="text-[#1E1E1E] font-bold">{filteredCategories.length}</span> OF 24 DEPARTMENTS
        </div>
        {searchQuery && (
          <span className="text-[#DB4A2B] font-bold">
            FILTER: &ldquo;{searchQuery}&rdquo;
          </span>
        )}
      </div>

      {/* Grid of All 24 Categories: 3 columns desktop, 2 tablets, 1 mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((cat: TaxonomyCategory) => {
          const Icon = cat.icon;
          const count = counts[cat.id.toLowerCase()] || 0;

          return (
            <article
              key={cat.id}
              className="group bg-[#FFFFFF] border border-[#1E1E1E]/20 hover:border-[#1E1E1E] transition-all flex flex-col justify-between"
            >
              {/* Card Header & Image */}
              <Link
                to={`/?category=${encodeURIComponent(cat.id)}`}
                className="block relative aspect-[16/10] overflow-hidden bg-[#E4E2DD] border-b border-[#1E1E1E]/15"
              >
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E1E]/80 via-transparent to-transparent flex items-end p-4">
                  <div className="flex items-center justify-between w-full text-[#FFFFFF]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-[#1E1E1E] text-[#E4E2DD] flex items-center justify-center border border-[#FFFFFF]/30">
                        <Icon className="w-4 h-4 text-[#FF89A9]" />
                      </div>
                      <div>
                        <h2 className="font-clash text-base font-bold uppercase tracking-tight text-[#FFFFFF] leading-snug">
                          {cat.name}
                        </h2>
                        <span className="text-[10px] font-mono text-[#E4E2DD]/70 uppercase">
                          {count > 0 ? `${count} ITEMS IN ARCHIVE` : 'VERIFIED CATALOG'}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-[#FFFFFF] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Card Body */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <p className="text-xs text-[#444444] leading-relaxed line-clamp-2">
                  {cat.desc}
                </p>

                {/* Subcategories tags */}
                <div className="space-y-2 pt-2 border-t border-[#1E1E1E]/10">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#444444] block">
                    SUBCATEGORIES
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {cat.subcategories.slice(0, 4).map((sub) => (
                      <Link
                        key={sub}
                        to={`/?category=${encodeURIComponent(cat.id)}&subcategory=${encodeURIComponent(sub)}`}
                        className="px-2 py-0.5 bg-[#E4E2DD] hover:bg-[#1E1E1E] hover:text-[#E4E2DD] text-[10px] font-mono uppercase tracking-wider text-[#1E1E1E] transition-colors"
                      >
                        {sub}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2">
                  <Link
                    to={`/?category=${encodeURIComponent(cat.id)}`}
                    className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#1E1E1E] group-hover:text-[#DB4A2B] transition-colors"
                  >
                    <span>ENTER DEPARTMENT</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default CategoriesPage;
