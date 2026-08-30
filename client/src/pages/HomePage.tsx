import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  User as UserIcon,
  Building2,
  Mail,
  Calendar,
  Lock,
  ArrowRight,
  LogOut,
  Sparkles,
  Server,
  Layers,
  Database,
  Cpu,
  CheckCircle2,
  Copy,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = () => {
    if (user?._id) {
      navigator.clipboard.writeText(user._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRoleTheme = (role?: string) => {
    switch (role) {
      case 'admin':
        return {
          badge: (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Platform Administrator</span>
            </span>
          ),
          accent: 'border-purple-200 bg-purple-50/30',
          title: 'Administrator Console',
          subtitle: 'Full governance, service monitoring, and RBAC control across all microservices.',
        };
      case 'company':
        return {
          badge: (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Building2 className="w-3.5 h-3.5" />
              <span>Merchant Company Workspace</span>
            </span>
          ),
          accent: 'border-indigo-200 bg-indigo-50/20',
          title: user?.companyName || 'Merchant Workspace',
          subtitle: 'Store merchant portal for catalog management, stock replenishment, and order dispatch.',
        };
      case 'customer':
      default:
        return {
          badge: (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Customer Account</span>
            </span>
          ),
          accent: 'border-emerald-200 bg-emerald-50/20',
          title: 'Customer Dashboard',
          subtitle: 'Personal buyer profile, saved preferences, and order tracking.',
        };
    }
  };

  const theme = getRoleTheme(user?.role);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-9 h-9 border-3 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
            Verifying Session with Gateway...
          </p>
        </div>
      ) : user ? (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-indigo-50/60 to-transparent pointer-events-none rounded-full translate-x-1/3 -translate-y-1/3" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start sm:items-center gap-4">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-zinc-100 shadow-xs"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                    {user.role === 'company' ? (
                      <Building2 className="w-8 h-8 text-indigo-300" />
                    ) : (
                      user.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
                      {user.name}
                    </h1>
                    {theme.badge}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xl">
                    {theme.subtitle}
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
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Gateway Proxy</span>
                <Layers className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-base font-bold text-zinc-900">Port 5000</div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>CORS & Route Forwarding</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Auth Service</span>
                <Server className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-base font-bold text-zinc-900">Port 5001</div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Active Session Verified</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Database</span>
                <Database className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-base font-bold text-zinc-900">MongoDB Atlas</div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Cluster Online</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Rate Limiter</span>
                <Cpu className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-base font-bold text-zinc-900">Redis Guard</div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>10 req / 15m window</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs divide-y divide-zinc-100">
            <div className="p-6 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
                  Account Credentials & RBAC Profile
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Restored automatically from HTTP-only secure cookie via API Gateway.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-[11px] font-mono text-zinc-600 border border-zinc-200">
                /api/auth/me
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    {user.role === 'company' ? 'Authorized Person' : 'Full Name'}
                  </span>
                  <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="text-sm font-semibold text-zinc-900">{user.name}</div>
              </div>

              {user.role === 'company' && user.companyName && (
                <div className="p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-200/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider">
                      Registered Business
                    </span>
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="text-sm font-semibold text-zinc-900">{user.companyName}</div>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Email Address
                  </span>
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="text-sm font-semibold text-zinc-900 truncate">{user.email}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Account Role
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="text-sm font-semibold text-zinc-900 capitalize">{user.role}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Member Since
                  </span>
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                </div>
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
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    User UUID
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="text-zinc-400 hover:text-zinc-700 transition-colors"
                    title="Copy User ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs font-mono text-zinc-600 truncate">
                  {copied ? 'Copied to clipboard!' : user._id}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative py-12 px-6 sm:px-12 bg-white rounded-3xl border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center overflow-hidden bg-grid-pattern">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-radial from-zinc-200/50 to-transparent pointer-events-none rounded-full" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-semibold border border-zinc-200 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Multi-Role Microservices E-Commerce</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-950 tracking-tight leading-tight">
              Production-Grade Microservices Architecture
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-lg mx-auto">
              Secure authentication gateway supporting Customers, Merchant Companies, and Administrators with HTTP-only cookies and Redis rate limiting.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl shadow-xs transition-all active:scale-[0.98]"
              >
                <span>Create an Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 rounded-xl transition-all active:scale-[0.98]"
              >
                <span>Sign In</span>
              </Link>
            </div>

            <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-zinc-100 text-left">
              <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/60">
                <div className="flex items-center gap-2 text-zinc-900 text-xs font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>3-Tier RBAC</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Custom workspaces for Customers, Companies, and Administrators.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/60">
                <div className="flex items-center gap-2 text-zinc-900 text-xs font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>API Gateway :5000</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Reverse proxy routing, CORS credentials, and cookie forwarding.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/60">
                <div className="flex items-center gap-2 text-zinc-900 text-xs font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>Redis & Atlas</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Brute-force protection with MongoDB Atlas document persistence.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
