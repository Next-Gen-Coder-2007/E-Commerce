import React, { useState } from 'react';
import { getGatewayBaseUrl } from '../utils/apiConfig';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Lock,
  Headphones,
  ArrowRight,
  Check,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 4000);
  };

  return (
    <footer className="bg-[#1E1E1E] text-[#E4E2DD] border-t-2 border-[#1E1E1E] pt-20 pb-12 mt-auto font-satoshi relative overflow-hidden select-none">
      {/* Decorative Oversized Year Watermark in Clash Display */}
      <div
        className="absolute top-2 right-4 text-[12rem] sm:text-[18rem] lg:text-[22rem] font-clash font-black text-[#FFFFFF]/[0.025] leading-none pointer-events-none select-none z-0"
        aria-hidden="true"
      >
        2026
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Value Propositions Strip */}
        <div className="pb-16 border-b border-[#FFFFFF]/10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-[#FFFFFF]/[0.03] border border-[#FFFFFF]/10 hover:border-[#DB4A2B] transition-colors duration-300">
              <div className="w-10 h-10 bg-[#FFFFFF] text-[#1E1E1E] flex items-center justify-center font-bold mb-4">
                <Truck className="w-5 h-5 text-[#DB4A2B]" />
              </div>
              <h4 className="font-clash text-base font-bold uppercase tracking-tight text-[#FFFFFF]">
                EXPRESS DISPATCH
              </h4>
              <p className="mt-1.5 text-xs text-[#E4E2DD]/70 leading-relaxed">
                Free standard courier shipping on orders over $50 with microservice telemetry.
              </p>
            </div>

            <div className="p-6 bg-[#FFFFFF]/[0.03] border border-[#FFFFFF]/10 hover:border-[#DB4A2B] transition-colors duration-300">
              <div className="w-10 h-10 bg-[#FFFFFF] text-[#1E1E1E] flex items-center justify-center font-bold mb-4">
                <ShieldCheck className="w-5 h-5 text-[#DB4A2B]" />
              </div>
              <h4 className="font-clash text-base font-bold uppercase tracking-tight text-[#FFFFFF]">
                AUTHENTIC ARCHIVE
              </h4>
              <p className="mt-1.5 text-xs text-[#E4E2DD]/70 leading-relaxed">
                100% verified merchant origins with manufacturer certificates and warranties.
              </p>
            </div>

            <div className="p-6 bg-[#FFFFFF]/[0.03] border border-[#FFFFFF]/10 hover:border-[#DB4A2B] transition-colors duration-300">
              <div className="w-10 h-10 bg-[#FFFFFF] text-[#1E1E1E] flex items-center justify-center font-bold mb-4">
                <RotateCcw className="w-5 h-5 text-[#DB4A2B]" />
              </div>
              <h4 className="font-clash text-base font-bold uppercase tracking-tight text-[#FFFFFF]">
                30-DAY RESOLUTION
              </h4>
              <p className="mt-1.5 text-xs text-[#E4E2DD]/70 leading-relaxed">
                Frictionless returns powered by automated Saga compensation transactions.
              </p>
            </div>

            <div className="p-6 bg-[#FFFFFF]/[0.03] border border-[#FFFFFF]/10 hover:border-[#DB4A2B] transition-colors duration-300">
              <div className="w-10 h-10 bg-[#FFFFFF] text-[#1E1E1E] flex items-center justify-center font-bold mb-4">
                <Headphones className="w-5 h-5 text-[#DB4A2B]" />
              </div>
              <h4 className="font-clash text-base font-bold uppercase tracking-tight text-[#FFFFFF]">
                CONCIERGE DESK
              </h4>
              <p className="mt-1.5 text-xs text-[#E4E2DD]/70 leading-relaxed">
                24/7 dedicated support via intelligent semantic LLM shopping concierge.
              </p>
            </div>
          </div>
        </div>

        {/* 4-Column Editorial Links & Newsletter Layout */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 border-b border-[#FFFFFF]/10">
          {/* Column 1: Brand & Editorial Identity (lg: 4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <Link to="/" className="inline-block group">
              <span className="font-clash text-3xl font-bold uppercase tracking-[-0.05em] text-[#FFFFFF] group-hover:text-[#DB4A2B] transition-colors">
                NOVA COMMERCE
              </span>
              <div className="text-[11px] font-mono text-[#DB4A2B] tracking-widest uppercase mt-0.5">
                PREMIUM E-COMMERCE MARKETPLACE
              </div>
            </Link>

            <p className="text-xs text-[#E4E2DD]/70 leading-relaxed max-w-sm">
              An experimental design study at the intersection of Swiss typography, editorial composition, and enterprise distributed commerce. Powered by real-time microservices.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('toggle-ai-assistant'));
                  window.dispatchEvent(new CustomEvent('open-ai-assistant'));
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFFFFF] text-[#1E1E1E] hover:bg-[#DB4A2B] hover:text-[#FFFFFF] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>OPEN AI SHOPPING CONCIERGE</span>
              </button>
            </div>
          </div>

          {/* Column 2: Shopping Categories (lg: 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h5 className="font-clash text-sm font-bold uppercase tracking-wider text-[#FFFFFF] border-b border-[#FFFFFF]/20 pb-2">
              DEPARTMENTS
            </h5>
            <ul className="space-y-2.5 text-xs font-medium">
              {[
                { name: 'MOBILES & CELLULAR', id: 'mobiles' },
                { name: 'COMPUTING & TECH', id: 'laptops-computers' },
                { name: 'AUDIO & ELECTRONICS', id: 'electronics' },
                { name: 'DESIGNER FASHION', id: 'fashion' },
                { name: 'LIVING & FURNITURE', id: 'home-furniture' },
                { name: 'BEAUTY & DERMA', id: 'beauty-personal-care' },
              ].map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/?category=${encodeURIComponent(cat.id)}`}
                    className="text-[#E4E2DD]/70 hover:text-[#DB4A2B] transition-colors uppercase tracking-wider text-[11px]"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link
                  to="/categories"
                  className="font-bold text-[#FFFFFF] hover:text-[#DB4A2B] transition-colors uppercase tracking-wider text-[11px] inline-flex items-center gap-1"
                >
                  <span>ALL 24 DEPARTMENTS →</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Operations (lg: 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h5 className="font-clash text-sm font-bold uppercase tracking-wider text-[#FFFFFF] border-b border-[#FFFFFF]/20 pb-2">
              GOVERNANCE
            </h5>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link to="/orders" className="text-[#E4E2DD]/70 hover:text-[#DB4A2B] transition-colors uppercase tracking-wider text-[11px]">
                  SHIPMENT TRACKING
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="text-[#E4E2DD]/70 hover:text-[#DB4A2B] transition-colors uppercase tracking-wider text-[11px]">
                  SAVED ARCHIVE
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-[#E4E2DD]/70 hover:text-[#DB4A2B] transition-colors uppercase tracking-wider text-[11px]">
                  ACCOUNT SETTINGS
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-[#E4E2DD]/70 hover:text-[#DB4A2B] transition-colors uppercase tracking-wider text-[11px]">
                  TERMS OF SERVICE
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-[#E4E2DD]/70 hover:text-[#DB4A2B] transition-colors uppercase tracking-wider text-[11px]">
                  PRIVACY PROTOCOLS
                </Link>
              </li>
              <li>
                <Link to="/business" className="text-[#DB4A2B] hover:text-[#FFFFFF] transition-colors uppercase font-bold tracking-wider text-[11px]">
                  MERCHANT PORTAL →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter Subscription (lg: 4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h5 className="font-clash text-sm font-bold uppercase tracking-wider text-[#FFFFFF] border-b border-[#FFFFFF]/20 pb-2">
              DISPATCH GAZETTE
            </h5>
            <p className="text-xs text-[#E4E2DD]/70 leading-relaxed">
              Receive seasonal lookbooks, experimental product drops, and exclusive campaign privileges.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="YOUR WORK EMAIL..."
                  required
                  className="w-full bg-[#FFFFFF]/[0.08] border border-[#FFFFFF]/20 text-[#FFFFFF] placeholder-[#E4E2DD]/40 px-3.5 py-2.5 text-xs font-mono tracking-wider focus:outline-none focus:border-[#FFFFFF] transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 bg-[#FFFFFF] hover:bg-[#DB4A2B] text-[#1E1E1E] hover:text-[#FFFFFF] transition-colors font-bold text-xs uppercase shrink-0 flex items-center justify-center cursor-pointer"
                >
                  {subscribed ? <Check className="w-4 h-4 text-emerald-600" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
              {subscribed && (
                <span className="text-[11px] font-mono text-emerald-400 block">
                  SUBSCRIPTION CONFIRMED / WELCOME TO THE ARCHIVE
                </span>
              )}
            </form>

            <div className="pt-2 text-[10px] font-mono text-[#E4E2DD]/50">
              API GATEWAY / <a href={`${getGatewayBaseUrl()}/docs`} target="_blank" rel="noreferrer" className="text-[#DB4A2B] hover:underline">SWAGGER OPENAPI 3.0</a>
            </div>
          </div>
        </div>

        {/* Bottom Section: Decorative Year, Legal, PCI & SSL compliance */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[#E4E2DD]/60 font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <span className="uppercase">&copy; 2026 NOVA COMMERCE INC. ALL RIGHTS RESERVED.</span>
            <span>/</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 bg-emerald-500 animate-pulse" />
              MICROSERVICES CLUSTER OPERATIONAL
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#DB4A2B]" />
              256-BIT TLS ENCRYPTED
            </span>
            <span>/</span>
            <span>PCI-DSS CERTIFIED</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
