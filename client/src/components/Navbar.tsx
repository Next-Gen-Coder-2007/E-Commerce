import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  LogOut,
  User as UserIcon,
  Building2,
  ShieldCheck,
  Sparkles,
  Store,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isBusinessSection = location.pathname.startsWith('/business');

  const handleLogout = async () => {
    await logout();
    navigate(isBusinessSection ? '/business/login' : '/login');
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
            <ShieldCheck className="w-3 h-3 text-purple-600" />
            <span>Admin</span>
          </span>
        );
      case 'company':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <Building2 className="w-3 h-3 text-indigo-600" />
            <span>Company</span>
          </span>
        );
      case 'customer':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Customer</span>
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            to={isBusinessSection ? '/business' : '/'}
            className="flex items-center gap-2.5 group transition-all"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-[1.02] transition-transform ${
              isBusinessSection ? 'bg-indigo-600' : 'bg-zinc-900'
            }`}>
              {isBusinessSection ? (
                <Building2 className="w-4.5 h-4.5" />
              ) : (
                <ShoppingBag className="w-4.5 h-4.5" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-zinc-950 flex items-center gap-1.5">
                <span>NovaCommerce</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border ${
                  isBusinessSection
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}>
                  {isBusinessSection ? 'Business' : 'Retail'}
                </span>
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">
                Microservices Platform
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-zinc-200">
            <Link
              to="/"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                !isBusinessSection
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              Marketplace
            </Link>
            <Link
              to="/business"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                isBusinessSection
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>For Business</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-28 bg-zinc-100 animate-pulse rounded-lg"></div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 p-1 sm:pr-3 sm:pl-1 rounded-full sm:rounded-xl border border-zinc-200/70 bg-zinc-50/70">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-zinc-200"
                  />
                ) : (
                  <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-2xs ${
                    user.role === 'company' ? 'bg-indigo-600' : 'bg-zinc-900'
                  }`}>
                    {user.role === 'company' ? (
                      <Building2 className="w-3.5 h-3.5" />
                    ) : (
                      user.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-900 leading-tight max-w-[120px] truncate">
                      {user.name}
                    </span>
                    {getRoleBadge(user.role)}
                  </div>
                  {user.role === 'company' && user.companyName && (
                    <span className="text-[10px] text-zinc-400 font-medium max-w-[120px] truncate">
                      {user.companyName}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-100 border border-zinc-200/80 rounded-lg shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                title="Sign out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              {isBusinessSection ? (
                <>
                  <Link
                    to="/business/login"
                    className="px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950 rounded-lg transition-colors"
                  >
                    Merchant Login
                  </Link>
                  <Link
                    to="/business/register"
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-all active:scale-[0.98]"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Register Business</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs transition-all active:scale-[0.98]"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Get Started</span>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
