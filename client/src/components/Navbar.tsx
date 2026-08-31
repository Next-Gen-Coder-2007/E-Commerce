import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  ShoppingBag,
  LogOut,
  Sparkles,
  Search,
  X,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const { totalItems, openCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    const currentCat = searchParams.get('category');
    if (currentCat && currentCat !== 'all') {
      params.set('category', currentCat);
    }
    navigate(`/?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    navigate(`/?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-zinc-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-zinc-950 leading-none">
                  NovaCommerce
                </span>
                <span className="text-[10px] text-zinc-400 font-medium tracking-tight">
                  Modern Marketplace
                </span>
              </div>
            </Link>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-xl hidden md:flex items-center relative"
          >
            <div className="w-full relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products, brands, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 rounded-xl bg-zinc-100/80 hover:bg-zinc-100 border border-zinc-200/80 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center gap-3 shrink-0">
            {loading ? (
              <div className="h-8 w-24 bg-zinc-100 animate-pulse rounded-lg" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 p-1 sm:pr-3 sm:pl-1 rounded-xl bg-zinc-50 border border-zinc-200/80">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-zinc-900 leading-tight truncate max-w-[110px]">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 capitalize">
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg shadow-xs transition-transform active:scale-[0.98]"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={openCart}
              className="p-2 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-all relative cursor-pointer group"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-105 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-zinc-950 text-white font-mono text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in-50">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="md:hidden pb-3 pt-1 flex items-center relative"
        >
          <Search className="w-4 h-4 absolute left-3.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products, brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-zinc-100 border border-zinc-200/80 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>
    </header>
  );
};
