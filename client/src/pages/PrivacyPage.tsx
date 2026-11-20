import React from 'react';
import { Lock, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrutalistButton } from '../components/BrutalistButton';

export const PrivacyPage: React.FC = () => {
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
            <Lock className="w-3.5 h-3.5 text-[#FF89A9]" />
            <span>SECURITY DIRECTIVE // SECTION 002</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-clash font-bold tracking-[-0.04em] uppercase text-[#1E1E1E] leading-none">
            Privacy Policy & Cryptographic Protocols
          </h1>
          
          <p className="text-xs font-mono text-[#444444] uppercase tracking-wider">
            LAST RATIFIED: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} // TLS 1.3 & ZERO-KNOWLEDGE LEDGER
          </p>
        </div>

        {/* Content Poster Card */}
        <div className="border-2 border-[#1E1E1E] bg-white p-8 sm:p-12 shadow-[10px_10px_0px_#1E1E1E] space-y-10">
          
          <section className="space-y-3 pb-8 border-b border-zinc-200">
            <div className="flex items-baseline gap-4">
              <span className="text-2xl sm:text-3xl font-clash font-bold text-[#DB4A2B]">01</span>
              <h2 className="text-xl sm:text-2xl font-clash font-bold uppercase tracking-tight text-[#1E1E1E]">
                Information Collection & Intent Purpose
              </h2>
            </div>
            <p className="text-sm font-satoshi text-[#444444] leading-relaxed pl-10">
              We collect only the transactional information necessary to fulfill orders, verify fraud protection, and provide personalized product recommendations. This includes contact email, shipping address, and order history.
            </p>
          </section>

          <section className="space-y-3 pb-8 border-b border-zinc-200">
            <div className="flex items-baseline gap-4">
              <span className="text-2xl sm:text-3xl font-clash font-bold text-[#DB4A2B]">02</span>
              <h2 className="text-xl sm:text-2xl font-clash font-bold uppercase tracking-tight text-[#1E1E1E]">
                256-Bit SSL Encryption & Payment Protection
              </h2>
            </div>
            <p className="text-sm font-satoshi text-[#444444] leading-relaxed pl-10">
              All communications traversing our API Gateway are guarded by end-to-end TLS 1.3 encryption. Payment transactions conform rigorously to PCI-DSS Level 1 standards.
            </p>
          </section>

          <section className="space-y-3 pb-8 border-b border-zinc-200">
            <div className="flex items-baseline gap-4">
              <span className="text-2xl sm:text-3xl font-clash font-bold text-[#DB4A2B]">03</span>
              <h2 className="text-xl sm:text-2xl font-clash font-bold uppercase tracking-tight text-[#1E1E1E]">
                Personalized Recommendations & User Privacy
              </h2>
            </div>
            <p className="text-sm font-satoshi text-[#444444] leading-relaxed pl-10">
              To power contextual shopping recommendations, our algorithms evaluate wishlist interactions, category browsing, and order history. Your personal data is never sold or traded to third-party advertising brokers.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-baseline gap-4">
              <span className="text-2xl sm:text-3xl font-clash font-bold text-[#DB4A2B]">04</span>
              <h2 className="text-xl sm:text-2xl font-clash font-bold uppercase tracking-tight text-[#1E1E1E]">
                Data Subject Rights (GDPR & CCPA Compliant)
              </h2>
            </div>
            <p className="text-sm font-satoshi text-[#444444] leading-relaxed pl-10">
              You retain full rights to review, export, or permanently erase your user profile and purchase records at any point by dispatching a request through account settings or customer support.
            </p>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-between p-6 border-2 border-[#1E1E1E] bg-[#D9D6D0]">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider block">DATA PROTECTION OFFICER</span>
            <span className="text-xs font-satoshi text-[#444444]">privacy@novacommerce.com // PRIVACY DESK</span>
          </div>
          <BrutalistButton to="/" variant="secondary">
            <span>Return to Storefront</span>
          </BrutalistButton>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
