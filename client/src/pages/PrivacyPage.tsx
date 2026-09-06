import React from 'react';
import { Lock } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <div className="space-y-2 border-b border-zinc-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5" />
          <span>Security & Data Privacy</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">
          Privacy Policy & Encryption Standards
        </h1>
        <p className="text-xs text-zinc-500">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 sm:p-10 shadow-xs space-y-8 text-xs text-zinc-600 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">1. Information Collection & Purpose</h2>
          <p>
            We collect personal information necessary to execute transactions, compute real-time fraud scores, and provide personalized AI shopping recommendations. This includes contact email, delivery address, and behavioral browsing intent.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">2. 256-Bit SSL Encryption & Idempotency Storage</h2>
          <p>
            All network communication across our API Gateway and backend microservices is protected by end-to-end TLS 1.3 encryption. Sensitive payment tokens and idempotency keys are salted and hashed in compliance with PCI-DSS Level 1 specifications.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">3. AI Vector Embeddings & User Profiling</h2>
          <p>
            To deliver personalized recommendations, our recommendation engine processes anonymized multi-signal vectors (Wishlist additions, category views, and purchase history). Your personal data is never sold to third-party ad networks.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">4. Data Subject Rights (GDPR & CCPA)</h2>
          <p>
            You retain the right to access, export, or permanently delete your account profile and order transaction metadata by submitting a request through your user profile settings.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
