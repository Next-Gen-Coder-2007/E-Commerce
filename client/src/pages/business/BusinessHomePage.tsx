import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Package,
  TrendingUp,
  CreditCard,
  Users,
  ShieldCheck,
  ArrowRight,
  LogOut,
  Sparkles,
  Server,
  Layers,
  Database,
  Cpu,
  Copy,
  PlusCircle,
  Store,
} from 'lucide-react';

export const BusinessHomePage: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = () => {
    if (user?._id) {
      navigator.clipboard.writeText(user._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
            Loading Merchant Workspace...
          </p>
        </div>
      ) : user && user.role === 'company' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-indigo-100 p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-indigo-100/50 to-transparent pointer-events-none rounded-full translate-x-1/3 -translate-y-1/3" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-indigo-600/20">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
                      {user.companyName || user.name}
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Store className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Verified Merchant Store</span>
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Contact: {user.name} ({user.email}) · Dedicated Route: <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-mono text-[11px]">/business/*</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Merchant Logout</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Active Inventory</span>
                <Package className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-base font-bold text-zinc-900">Product Service</div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span>Planned in Phase 2</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Merchant Sales</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-base font-bold text-zinc-900">Order Service</div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span>Planned in Phase 4</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Payout Gateway</span>
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-base font-bold text-zinc-900">Payment Service</div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span>Planned in Phase 5</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">RBAC Security</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-base font-bold text-zinc-900">Role: Company</div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Protected via Gateway</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs divide-y divide-zinc-100">
            <div className="p-6 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
                  Merchant Enterprise Profile
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Verified by Auth Service under the dedicated business route.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-[11px] font-mono font-bold text-indigo-700 border border-indigo-200">
                  /business
                </span>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70 space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Company Legal Entity
                </span>
                <div className="text-sm font-semibold text-zinc-900">
                  {user.companyName || 'Registered Merchant'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70 space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Authorized Contact
                </span>
                <div className="text-sm font-semibold text-zinc-900">{user.name}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70 space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Business Email
                </span>
                <div className="text-sm font-semibold text-zinc-900 truncate">{user.email}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Company Merchant UUID
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                    title="Copy Company ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs font-mono text-zinc-600 truncate">
                  {copied ? 'Copied!' : user._id}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70 space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Account Created
                </span>
                <div className="text-sm font-semibold text-zinc-900">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Active'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70 space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Security Protocol
                </span>
                <div className="text-xs text-emerald-600 font-semibold">
                  HTTP-only JWT + Redis Limiter
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : user && user.role === 'customer' ? (
        <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900">
            Customer Account Detected
          </h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            You are currently signed in with individual customer account <strong className="text-zinc-900">{user.email}</strong>. The <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-zinc-700">/business/*</code> route namespace is dedicated to merchant companies.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <Link
              to="/"
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
            >
              Go to Customer Home
            </Link>
            <Link
              to="/business/register"
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Register Company Account
            </Link>
          </div>
        </div>
      ) : (
        <div className="relative py-12 px-6 sm:px-12 bg-white rounded-3xl border border-indigo-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center overflow-hidden bg-grid-pattern">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-radial from-indigo-100/60 to-transparent pointer-events-none rounded-full" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Dedicated Merchant & Company Route Point</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-950 tracking-tight leading-tight">
              Enterprise Merchant Platform
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-lg mx-auto">
              A dedicated portal for companies and merchants to manage catalogs, track B2B & retail orders, and manage inventory across microservices.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/business/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all active:scale-[0.98]"
              >
                <span>Register Merchant Store</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/business/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 rounded-xl transition-all active:scale-[0.98]"
              >
                <span>Merchant Sign In</span>
              </Link>
            </div>

            <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-zinc-100 text-left">
              <div className="p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-100">
                <div className="flex items-center gap-2 text-zinc-900 text-xs font-bold mb-1">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <span>Dedicated Namespace</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  All business endpoints and pages grouped cleanly under <code className="font-mono text-indigo-700">/business/*</code>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-100">
                <div className="flex items-center gap-2 text-zinc-900 text-xs font-bold mb-1">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Scalable Architecture</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Ready for future Product, Inventory, and Order microservice integrations.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-100">
                <div className="flex items-center gap-2 text-zinc-900 text-xs font-bold mb-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Company RBAC</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Strict role verification protecting merchant resources.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
