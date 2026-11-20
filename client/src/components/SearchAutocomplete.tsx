import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAutocompleteApi, AutocompleteResponse } from '../services/productService';
import { Search, X, Sparkles, ArrowRight } from 'lucide-react';

interface SearchAutocompleteProps {
  onSelectCategory?: (category: string) => void;
  className?: string;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({ onSelectCategory, className = '' }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AutocompleteResponse['data'] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search suggestions as user types
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!query || query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await searchAutocompleteApi(query.trim(), 6);
        setResults(res.data);
      } catch (err) {
        console.warn('[Autocomplete] Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 120);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    navigate(`/?search=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectProduct = (productId: string) => {
    setIsOpen(false);
    navigate(`/product/${productId}`);
  };

  const handleSelectSuggestion = (term: string) => {
    setQuery(term);
    setIsOpen(false);
    navigate(`/?search=${encodeURIComponent(term)}`);
  };

  const handleSelectCat = (category: string) => {
    setIsOpen(false);
    if (onSelectCategory) {
      onSelectCategory(category);
    } else {
      navigate(`/?category=${encodeURIComponent(category)}`);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="SEARCH CATALOG / ARCHIVE..."
          className="w-full pl-9 pr-9 py-2.5 rounded-none bg-[#FFFFFF] border border-[#1E1E1E]/20 text-[#1E1E1E] placeholder-[#444444]/60 text-xs font-satoshi uppercase tracking-wider focus:outline-none focus:border-[#1E1E1E] transition duration-200"
        />
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#1E1E1E]/60 pointer-events-none" />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults(null);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#444444] hover:text-[#DB4A2B] text-xs p-1 cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Floating Dropdown Results */}
      {isOpen && (query.trim().length >= 2 || results) && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-none bg-[#FFFFFF] border-2 border-[#1E1E1E] shadow-2xl z-50 overflow-hidden text-[#1E1E1E]">
          {/* Telemetry Header */}
          <div className="px-3.5 py-2 border-b border-[#1E1E1E]/15 flex items-center justify-between text-[10px] text-[#444444] bg-[#D9D6D0]/40 font-mono">
            <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider">
              <span className="w-1.5 h-1.5 bg-[#DB4A2B] animate-pulse" />
              INDEX SEARCH DISCOVERY
            </span>
            {results?.searchTelemetry?.latencyMs !== undefined && (
              <span className="text-[#1E1E1E] font-bold">
                {results.searchTelemetry.latencyMs}MS
              </span>
            )}
          </div>

          {loading && (
            <div className="p-6 text-center text-xs text-[#444444] flex items-center justify-center space-x-2 font-mono">
              <div className="w-3.5 h-3.5 border-2 border-[#1E1E1E] border-t-transparent animate-spin" />
              <span className="uppercase tracking-widest text-[11px]">QUERYING ARCHIVE...</span>
            </div>
          )}

          {!loading && results && (
            <div className="max-h-96 overflow-y-auto p-3 space-y-3 font-satoshi">
              {/* Fuzzy Match Alert */}
              {results.isFuzzyMatch && (
                <div className="p-2 border border-[#DB4A2B]/30 bg-[#DB4A2B]/5 text-[#DB4A2B] text-xs flex items-center space-x-2">
                  <Sparkles className="w-3 h-3 text-[#DB4A2B]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">FUZZY MATCH FOR &quot;{query}&quot;</span>
                </div>
              )}

              {/* Category Badges */}
              {results.categories && results.categories.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-[#444444] uppercase tracking-widest px-1 block mb-1">
                    DEPARTMENTS
                  </span>
                  <div className="flex flex-wrap gap-1 px-1">
                    {results.categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleSelectCat(cat)}
                        className="px-2.5 py-1 rounded-none bg-[#E4E2DD] hover:bg-[#1E1E1E] hover:text-[#E4E2DD] text-[#1E1E1E] border border-[#1E1E1E]/20 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Keyword Suggestions */}
              {results.suggestions && results.suggestions.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-[#444444] uppercase tracking-widest px-1 block mb-1">
                    INDEX SUGGESTIONS
                  </span>
                  <div className="space-y-0.5">
                    {results.suggestions.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSelectSuggestion(term)}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-[#E4E2DD] text-xs font-bold uppercase tracking-wider text-[#1E1E1E] hover:text-[#DB4A2B] flex items-center justify-between transition group cursor-pointer"
                      >
                        <span className="truncate">{term}</span>
                        <ArrowRight className="w-3 h-3 text-[#1E1E1E] group-hover:translate-x-1 group-hover:text-[#DB4A2B] transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Products Preview */}
              {results.products && results.products.length > 0 && (
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-[#444444] uppercase tracking-widest px-1 block mb-1">
                    MATCHED PRODUCTS ({results.products.length})
                  </span>
                  <div className="space-y-1">
                    {results.products.map((p) => (
                      <div
                        key={p._id}
                        onClick={() => handleSelectProduct(p._id)}
                        className="p-2 border border-transparent hover:border-[#1E1E1E] hover:bg-[#E4E2DD]/40 flex items-center justify-between gap-3 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                            alt={p.title}
                            className="w-9 h-12 object-cover bg-[#E4E2DD] shrink-0 border border-[#1E1E1E]/20"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#1E1E1E] uppercase tracking-tight truncate group-hover:text-[#DB4A2B]">
                              {p.title}
                            </div>
                            <div className="text-[10px] text-[#444444] uppercase font-mono tracking-wider">
                              {p.category}
                            </div>
                          </div>
                        </div>
                        <div className="font-mono font-bold text-xs text-[#1E1E1E] shrink-0">
                          ${p.price.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
