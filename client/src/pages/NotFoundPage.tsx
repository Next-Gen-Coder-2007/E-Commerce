import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-xl w-full text-center space-y-8 bg-white border border-zinc-200/80 rounded-3xl p-8 sm:p-12 shadow-xl shadow-zinc-950/5">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
            <span className="text-4xl font-black font-mono">404</span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
            Page Not Found in Catalog
          </h1>
          <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
            The page or product you are looking for might have moved, been renamed, or is temporarily unavailable.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs shadow-md shadow-zinc-950/10 transition active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Return to Storefront</span>
          </Link>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-concierge'))}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Ask AI Shopping Concierge</span>
          </button>
        </div>

        {/* Popular Category Shortcuts */}
        <div className="pt-6 border-t border-zinc-100 text-left">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 text-center">
            Or Explore Popular Collections
          </h4>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {['Smartphones', 'Laptops', 'Audio', 'Electronics', 'Fashion', 'Home'].map((cat) => (
              <Link
                key={cat}
                to={`/?category=${encodeURIComponent(cat.toLowerCase())}`}
                className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
