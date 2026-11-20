import React from 'react';
import { Scale, ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrutalistButton } from '../components/BrutalistButton';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#E4E2DD] text-[#1E1E1E] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Navigation & Header */}
        <div className="space-y-4 border-b-2 border-[#1E1E1E] pb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#1E1E1E] hover:text-[#DB4A2B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Return to Storefront</span>
          </Link>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1E1E1E] bg-[#1E1E1E] text-[#E4E2DD] text-[10px] font-mono font-bold uppercase tracking-widest">
            <Scale className="w-3.5 h-3.5 text-[#FF89A9]" />
            <span>LEGAL CODEX // SECTION 001</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-clash font-bold tracking-[-0.04em] uppercase text-[#1E1E1E] leading-none">
            Terms of Service & Buyer Protection
          </h1>
          
          <p className="text-xs font-mono text-[#444444] uppercase tracking-wider">
            LAST RATIFIED: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} // JURISDICTION: GLOBAL E-COMMERCE
          </p>
        </div>

        {/* Content Poster Card */}
        <div className="border-2 border-[#1E1E1E] bg-white p-8 sm:p-12 shadow-[10px_10px_0px_#1E1E1E] space-y-10">
          
          <section className="space-y-3 pb-8 border-b border-zinc-200">
            <div className="flex items-baseline gap-4">
              <span className="text-2xl sm:text-3xl font-clash font-bold text-[#DB4A2B]">01</span>
              <h2 className="text-xl sm:text-2xl font-clash font-bold uppercase tracking-tight text-[#1E1E1E]">
                Acceptance of Marketplace Terms
              </h2>
            </div>
            <p className="text-sm font-satoshi text-[#444444] leading-relaxed pl-10">
              By accessing or using the NovaCommerce platform, storefront APIs, and associated web or mobile interfaces, you agree to be bound by these terms. If you register as a verified merchant store, you additionally consent to our seller code of conduct and authentic goods guarantee.
            </p>
          </section>

          <section className="space-y-3 pb-8 border-b border-zinc-200">
            <div className="flex items-baseline gap-4">
              <span className="text-2xl sm:text-3xl font-clash font-bold text-[#DB4A2B]">02</span>
              <h2 className="text-xl sm:text-2xl font-clash font-bold uppercase tracking-tight text-[#1E1E1E]">
                Secure Order Processing & Escrow Protection
              </h2>
            </div>
            <p className="text-sm font-satoshi text-[#444444] leading-relaxed pl-10">
              Every checkout processes securely through our payment architecture across inventory, payment, and logistics services. Customer funds are held securely until physical dispatch is confirmed.
            </p>
          </section>

          <section className="space-y-3 pb-8 border-b border-zinc-200">
            <div className="flex items-baseline gap-4">
              <span className="text-2xl sm:text-3xl font-clash font-bold text-[#DB4A2B]">03</span>
              <h2 className="text-xl sm:text-2xl font-clash font-bold uppercase tracking-tight text-[#1E1E1E]">
                30-Day Guaranteed Returns & Fast Refunds
              </h2>
            </div>
            <p className="text-sm font-satoshi text-[#444444] leading-relaxed pl-10">
              Eligible items returned within 30 days of delivery receive a direct refund via the original payment method. Items must be returned in their original packaging with tags intact.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-baseline gap-4">
              <span className="text-2xl sm:text-3xl font-clash font-bold text-[#DB4A2B]">04</span>
              <h2 className="text-xl sm:text-2xl font-clash font-bold uppercase tracking-tight text-[#1E1E1E]">
                Merchant Obligations & Authenticity Guarantee
              </h2>
            </div>
            <p className="text-sm font-satoshi text-[#444444] leading-relaxed pl-10">
              Merchants warrant that all listed inventory is 100% genuine, authorized by respective brand rights-holders, and compliant with consumer safety standards. Counterfeit listings will result in immediate suspension and store termination.
            </p>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-between p-6 border-2 border-[#1E1E1E] bg-[#D9D6D0]">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider block">QUESTIONS OR LEGAL INQUIRIES?</span>
            <span className="text-xs font-satoshi text-[#444444]">Contact our support team at legal@novacommerce.com</span>
          </div>
          <BrutalistButton to="/" variant="secondary">
            <span>Explore Catalog</span>
          </BrutalistButton>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
