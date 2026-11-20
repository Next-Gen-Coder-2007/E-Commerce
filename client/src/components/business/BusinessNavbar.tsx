import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  LogOut,
  Store,
  PlusCircle,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react';
import { BrutalistButton } from '../BrutalistButton';

export const BusinessNavbar: React.FC<{ onOpenAddModal?: () => void }> = ({
  onOpenAddModal,
}) => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/business/login');
  };

  const isLoginPage = location.pathname === '/business/login';
  const isRegisterPage = location.pathname === '/business/register';

  return (
    <header className="sticky top-0 z-50 w-full bg-[#E4E2DD] border-b-2 border-[#1E1E1E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/business" className="flex items-center gap-3 group">
            <div className="w-10 h-10 border-2 border-[#1E1E1E] bg-[#1E1E1E] flex items-center justify-center text-white shadow-[2px_2px_0px_#DB4A2B] group-hover:bg-[#DB4A2B] transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 leading-none">
                <span className="text-base sm:text-lg font-clash font-bold text-[#1E1E1E] tracking-tight uppercase">
                  NOVA COMMERCE
                </span>
                <span className="text-[9px] uppercase font-mono font-bold tracking-widest px-1.5 py-0.5 bg-[#DB4A2B] text-white">
                  SELLER HUB
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#444444] tracking-tight uppercase mt-0.5">
                Merchant Operations Console
              </span>
            </div>
          </Link>

          {user && user.role === 'company' && user.companyName && (
            <div className="hidden md:flex items-center gap-2 pl-4 border-l-2 border-[#1E1E1E] text-xs font-mono">
              <Store className="w-3.5 h-3.5 text-[#DB4A2B]" />
              <span className="text-[#1E1E1E] font-bold truncate max-w-[150px] uppercase">
                {user.companyName}
              </span>
              <span className="w-2 h-2 bg-[#DB4A2B]"></span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-24 bg-white/60 border border-[#1E1E1E] animate-pulse" />
          ) : user && (user.role === 'company' || user.role === 'admin') ? (
            <div className="flex items-center gap-3">
              {onOpenAddModal && (
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 border-2 border-[#1E1E1E] bg-[#DB4A2B] hover:bg-[#1E1E1E] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0px_#1E1E1E] cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>List Product</span>
                </button>
              )}

              <Link
                to="/business"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#1E1E1E] bg-white hover:bg-[#1E1E1E] hover:text-white text-xs font-mono font-bold uppercase text-[#1E1E1E] transition-colors shadow-[2px_2px_0px_#1E1E1E]"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Console</span>
              </Link>

              <div className="flex items-center gap-2 px-2.5 py-1 border-2 border-[#1E1E1E] bg-white">
                <div className="w-6 h-6 bg-[#1E1E1E] text-[#E4E2DD] flex items-center justify-center font-clash font-bold text-xs uppercase">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-clash font-bold text-[#1E1E1E] leading-tight truncate max-w-[100px] uppercase">
                    {user.name}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-[#DB4A2B] uppercase">
                    MERCHANT
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-2 border-2 border-[#1E1E1E] bg-white hover:bg-[#DB4A2B] hover:text-white text-[#1E1E1E] transition-colors cursor-pointer"
                title="Sign out of Merchant Hub"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 font-mono text-xs font-bold uppercase">
              <Link
                to="/"
                className="text-[#444444] hover:text-[#1E1E1E] transition-colors"
              >
                Storefront
              </Link>
              {isLoginPage ? (
                <Link
                  to="/business/register"
                  className="px-3.5 py-1.5 border-2 border-[#1E1E1E] bg-[#1E1E1E] text-[#E4E2DD] hover:bg-[#DB4A2B] transition-colors shadow-[2px_2px_0px_#1E1E1E]"
                >
                  Register Entity
                </Link>
              ) : (
                <Link
                  to="/business/login"
                  className="px-3.5 py-1.5 border-2 border-[#1E1E1E] bg-[#1E1E1E] text-[#E4E2DD] hover:bg-[#DB4A2B] transition-colors shadow-[2px_2px_0px_#1E1E1E]"
                >
                  Merchant Access
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default BusinessNavbar;
