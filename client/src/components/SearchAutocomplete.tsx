import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAutocompleteApi, AutocompleteResponse } from '../services/productService';
import { Search, X, Sparkles, ArrowRight } from 'lucide-react';

interface SearchAutocompleteProps {
  onSelectCategory?: (category: string) => void;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({ onSelectCategory }) => {
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
    <div ref={containerRef} className="relative w-full max-w-lg">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search products, brands, categories..."
          className="w-full pl-10 pr-10 py-2 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-zinc-900 placeholder-zinc-400 text-xs sm:text-sm focus:outline-none focus:border-zinc-900 focus:bg-white transition shadow-2xs"
        />
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults(null);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 text-xs p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Floating Dropdown Results */}
      {isOpen && (query.trim().length >= 2 || results) && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-white border border-zinc-200 shadow-2xl z-50 overflow-hidden text-zinc-800">
          {/* Telemetry Header */}
          <div className="px-4 py-2 border-b border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-50/50">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Instant Search Discovery
            </span>
            {results?.searchTelemetry?.latencyMs !== undefined && (
              <span className="font-mono text-zinc-500 text-[10px]">
                {results.searchTelemetry.latencyMs}ms
              </span>
            )}
          </div>

          {loading && (
            <div className="p-6 text-center text-xs text-zinc-400 flex items-center justify-center space-x-2">
              <div className="w-3.5 h-3.5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
              <span>Searching catalog...</span>
            </div>
          )}

          {!loading && results && (
            <div className="max-h-96 overflow-y-auto p-3 space-y-4">
              {/* Fuzzy Match Alert */}
              {results.isFuzzyMatch && (
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Showing results matching &quot;{query}&quot;</span>
                </div>
              )}

              {/* Category Badges */}
              {results.categories && results.categories.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2">
                    Categories
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5 px-2">
                    {results.categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleSelectCat(cat)}
                        className="px-2.5 py-1 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 border border-zinc-200 text-xs capitalize transition cursor-pointer"
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
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2">
                    Suggestions
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {results.suggestions.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSelectSuggestion(term)}
                        className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-zinc-50 text-xs text-zinc-700 hover:text-zinc-950 flex items-center justify-between transition group cursor-pointer"
                      >
                        <span className="truncate">{term}</span>
                        <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:text-zinc-950 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Products Preview */}
              {results.products && results.products.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2">
                    Products ({results.products.length})
                  </span>
                  <div className="mt-1 space-y-1">
                    {results.products.map((p) => (
                      <div
                        key={p._id}
                        onClick={() => handleSelectProduct(p._id)}
                        className="p-2 rounded-2xl hover:bg-zinc-50 flex items-center justify-between gap-3 cursor-pointer transition border border-transparent hover:border-zinc-200/80"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                            alt={p.title}
                            className="w-10 h-10 rounded-xl object-cover bg-zinc-100 shrink-0 border border-zinc-200"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-zinc-900 truncate">
                              {p.title}
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              {p.category}
                            </div>
                          </div>
                        </div>
                        <div className="font-mono font-bold text-xs text-zinc-950 shrink-0">
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
