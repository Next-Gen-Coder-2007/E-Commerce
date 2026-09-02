import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Lock,
  Headphones,
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-zinc-500 text-xs border-t border-zinc-200/80 pt-16 pb-12 mt-auto">
      {/* Top Value Propositions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-zinc-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60">
            <div className="w-10 h-10 rounded-xl bg-white text-zinc-900 border border-zinc-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-950 text-sm">Ultra-Fast Delivery</h4>
              <p className="mt-1 text-zinc-500 leading-relaxed text-[11px]">
                Free standard shipping on orders over $50 with real-time tracking.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60">
            <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 border border-zinc-200 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-950 text-sm">100% Genuine Guarantee</h4>
              <p className="mt-1 text-zinc-500 leading-relaxed text-[11px]">
                Directly from verified brand stores with manufacturer warranties.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60">
            <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 border border-zinc-200 flex items-center justify-center shrink-0 shadow-2xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-950 text-sm">30-Day Easy Returns</h4>
              <p className="mt-1 text-zinc-500 leading-relaxed text-[11px]">
                Instant refund processing via automated Saga orchestrator.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60">
            <div className="w-10 h-10 rounded-xl bg-white text-amber-600 border border-zinc-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-950 text-sm">24/7 Priority Support</h4>
              <p className="mt-1 text-zinc-500 leading-relaxed text-[11px]">
                AI shopping concierge guidance and dedicated merchant support.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand & Mission */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-black text-sm shadow-xs">
                N
              </div>
              <span className="text-xl font-black tracking-tight text-zinc-950">NovaCommerce</span>
            </Link>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-sm">
              Next-generation marketplace platform powered by distributed microservices,
              AI semantic discovery, and transactional orchestration.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-concierge'))}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 border border-zinc-200 text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Shopping Assistant</span>
              </button>
            </div>
          </div>

          {/* Marketplace Categories */}
          <div>
            <h5 className="font-bold text-zinc-950 text-xs uppercase tracking-wider mb-3">Categories</h5>
            <ul className="space-y-2">
              {['Smartphones', 'Laptops', 'Audio', 'Electronics', 'Fashion', 'Home & Living'].map((cat) => (
                <li key={cat}>
                  <Link
                    to={`/?category=${encodeURIComponent(cat.toLowerCase().replace(' & living', ''))}`}
                    className="hover:text-zinc-950 transition"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h5 className="font-bold text-zinc-950 text-xs uppercase tracking-wider mb-3">Customer Care</h5>
            <ul className="space-y-2">
              <li>
                <Link to="/orders" className="hover:text-zinc-950 transition">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-zinc-950 transition">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-zinc-950 transition">
                  Account Settings
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-zinc-950 transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-zinc-950 transition">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Merchants & Admin */}
          <div>
            <h5 className="font-bold text-zinc-950 text-xs uppercase tracking-wider mb-3">For Business</h5>
            <ul className="space-y-2">
              <li>
                <Link to="/business" className="hover:text-zinc-950 transition">
                  Merchant Portal
                </Link>
              </li>
              <li>
                <Link to="/business/register" className="hover:text-zinc-950 transition">
                  Sell on NovaCommerce
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-indigo-600 transition font-semibold">
                  Admin Platform
                </Link>
              </li>
              <li>
                <a href="http://localhost:5000/docs" target="_blank" rel="noreferrer" className="hover:text-zinc-950 transition">
                  OpenAPI 3.0 Swagger
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Compliance */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          <span>&copy; {new Date().getFullYear()} NovaCommerce Inc. All rights reserved.</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Microservices Online
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-zinc-600" />
            256-Bit SSL Encrypted
          </span>
          <span>•</span>
          <span>PCI-DSS Compliant</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
