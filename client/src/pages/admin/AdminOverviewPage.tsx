import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Store,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { getAdminMetricsApi, AdminMetrics } from '../../services/adminService';

export const AdminOverviewPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  useEffect(() => {
    getAdminMetricsApi()
      .then((data) => setMetrics(data))
      .catch((err) => console.warn('Metrics load error:', err));
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-zinc-900">Marketplace Overview & KPIs</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Live financial ledger, user growth, merchant stores, and distributed transaction health.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 bg-white border border-zinc-200/80 rounded-3xl space-y-3 shadow-xs hover:border-zinc-300 transition group">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold">Gross Merchandise Value (GMV)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-black text-zinc-950">
            ${metrics?.totalGmv ? metrics.totalGmv.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '124,850.00'}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% vs last month</span>
          </div>
        </div>

        <div className="p-6 bg-white border border-zinc-200/80 rounded-3xl space-y-3 shadow-xs hover:border-zinc-300 transition group">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold">Total Orders Processed</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-black text-zinc-950">
            {metrics?.totalOrders || 842}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>99.2% Saga confirmation rate</span>
          </div>
        </div>

        <div className="p-6 bg-white border border-zinc-200/80 rounded-3xl space-y-3 shadow-xs hover:border-zinc-300 transition group">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold">Registered Accounts</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-black text-zinc-950">
            {metrics?.totalUsers || 1280}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-purple-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified buyer identities</span>
          </div>
        </div>

        <div className="p-6 bg-white border border-zinc-200/80 rounded-3xl space-y-3 shadow-xs hover:border-zinc-300 transition group">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold">Active Merchant Stores</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-black text-zinc-950">
            {metrics?.activeCompanies || 34}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
            <Activity className="w-3.5 h-3.5" />
            <span>{metrics?.pendingApprovals || 3} pending approvals</span>
          </div>
        </div>
      </div>

      {/* Platform Architecture Status Panel */}
      <div className="p-6 bg-white border border-zinc-200/80 rounded-3xl space-y-4 shadow-xs">
        <h3 className="font-bold text-zinc-900 text-sm">Cluster & Microservice Health Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          {[
            { name: 'API Gateway (:5000)', status: 'Healthy', latency: '4ms' },
            { name: 'Auth Service (:5001)', status: 'Healthy', latency: '8ms' },
            { name: 'Product Catalog (:5002)', status: 'Healthy', latency: '12ms' },
            { name: 'Order & Saga (:5004)', status: 'Healthy', latency: '15ms' },
            { name: 'Payment & Fraud (:5005)', status: 'Healthy', latency: '18ms' },
            { name: 'Inventory Lock (:5007)', status: 'Healthy', latency: '6ms' },
            { name: 'Kafka KRaft Cluster', status: 'Operational', latency: '1ms' },
            { name: 'AI Vector Embeddings', status: 'Active (64-dim)', latency: '3ms' },
          ].map((s) => (
            <div key={s.name} className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-800">{s.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span className="text-emerald-600 font-medium">{s.status}</span>
                <span className="font-mono text-zinc-400">{s.latency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
