import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-xl w-full text-center space-y-8 bg-white border border-zinc-200/80 rounded-2xl p-8 sm:p-12 shadow-xl shadow-zinc-950/5">
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-900">
            <span className="text-3xl font-bold font-mono">404</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
            The page or product you are looking for might have moved, been renamed, or is temporarily unavailable.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs transition"
          >
            <Home className="w-4 h-4" />
            <span>Return to Storefront</span>
          </Link>
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
