import React from 'react';
import { Scale } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <div className="space-y-2 border-b border-zinc-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
          <Scale className="w-3.5 h-3.5" />
          <span>Legal & Governance</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">
          Terms of Service & Buyer Protection
        </h1>
        <p className="text-xs text-zinc-500">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 sm:p-10 shadow-xs space-y-8 text-xs text-zinc-600 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">1. Acceptance of Marketplace Terms</h2>
          <p>
            By accessing or using the NovaCommerce platform, storefront APIs, and associated mobile or web interfaces, you agree to be bound by these Terms of Service. If you are registering as a verified merchant, you additionally agree to our Merchant Fulfillment & SLA Agreement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">2. Distributed Saga Transactions & Payment Escrow</h2>
          <p>
            All consumer orders are coordinated across our distributed Saga Orchestrator. Funds are held securely in payment escrow and only released upon successful two-phase inventory commitment and verified courier dispatch.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">3. 30-Day Hassle-Free Returns & Automated Refunds</h2>
          <p>
            Eligible purchases returned within 30 days of delivery will trigger an immediate automated refund compensation sequence via our payment gateway. Items must be returned in original manufacturer packaging.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">4. Merchant Obligations & Authentic Goods Guarantee</h2>
          <p>
            Merchants strictly warrant that all catalog items listed on NovaCommerce are 100% genuine, authorized by respective brand rights-holders, and comply with international consumer safety standards.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
