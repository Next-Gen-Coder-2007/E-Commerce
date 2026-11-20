import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { BrutalistButton } from '../components/BrutalistButton';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#E4E2DD] text-[#1E1E1E] flex items-center justify-center px-4 py-20">
      <div className="max-w-2xl w-full text-center space-y-8 border-2 border-[#1E1E1E] bg-white p-8 sm:p-14 shadow-[12px_12px_0px_#1E1E1E]">
        
        {/* Oversized 404 Stamp */}
        <div className="space-y-2">
          <div className="inline-block px-4 py-1 border-2 border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#DB4A2B] font-mono text-xs font-bold uppercase tracking-widest">
            ERROR CODE // 404 NOT LOCATED
          </div>
          <h1 className="text-7xl sm:text-9xl font-clash font-bold tracking-[-0.06em] text-[#1E1E1E] leading-none">
            404
          </h1>
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-xl sm:text-2xl font-clash font-bold uppercase tracking-tight text-[#1E1E1E]">
            Artifact Not Located in Archive
          </h2>
          <p className="text-xs sm:text-sm font-satoshi text-[#444444] leading-relaxed">
            The requested trajectory, editorial collection, or specific catalogue entry has migrated, been expunged, or is temporarily sequestered.
          </p>
        </div>

        {/* Quick Action Button */}
        <div className="pt-2 flex justify-center">
          <BrutalistButton to="/" variant="primary">
            <Home className="w-4 h-4 mr-2" />
            <span>Return to Storefront</span>
          </BrutalistButton>
        </div>

        {/* Popular Department Shortcuts */}
        <div className="pt-8 border-t-2 border-[#1E1E1E] text-left space-y-3">
          <h4 className="text-[10px] font-mono font-bold text-[#444444] uppercase tracking-widest text-center">
            RE-DIRECT TELEMETRY: CURATED DISCIPLINES
          </h4>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {['Smartphones', 'Laptops', 'Audio', 'Electronics', 'Fashion', 'Home'].map((cat) => (
              <Link
                key={cat}
                to={`/?category=${encodeURIComponent(cat.toLowerCase())}`}
                className="px-3 py-1.5 border border-[#1E1E1E] bg-[#E4E2DD] hover:bg-[#1E1E1E] hover:text-[#E4E2DD] text-xs font-mono font-bold uppercase transition-all shadow-[2px_2px_0px_#1E1E1E]"
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
