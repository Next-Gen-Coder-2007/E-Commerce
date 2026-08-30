import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  LogOut,
  Store,
  PlusCircle,
} from 'lucide-react';

export const BusinessNavbar: React.FC<{ onOpenAddModal?: () => void }> = ({
  onOpenAddModal,
}) => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/business/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-zinc-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/business" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-base font-extrabold text-zinc-950 tracking-tight">
                  NovaCommerce
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                  Seller Central
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium tracking-tight">
                Enterprise Merchant Studio
              </span>
            </div>
          </Link>

          {user && user.role === 'company' && user.companyName && (
            <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-zinc-200 text-xs">
              <Store className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-700 font-bold truncate max-w-[150px]">
                {user.companyName}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-24 bg-zinc-100 animate-pulse rounded-lg" />
          ) : user && (user.role === 'company' || user.role === 'admin') ? (
            <div className="flex items-center gap-3">
              {onOpenAddModal && (
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 transition-transform active:scale-[0.98] shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              )}

              <div className="flex items-center gap-2 p-1 sm:pr-3 sm:pl-1 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <div className="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-bold text-xs">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-zinc-900 leading-tight truncate max-w-[100px]">
                    {user.name}
                  </span>
                  <span className="text-[9px] font-semibold text-zinc-400">
                    MERCHANT
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:text-rose-600 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors cursor-pointer"
                title="Merchant Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/business/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/business/register"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg shadow-xs"
              >
                Register Business
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
