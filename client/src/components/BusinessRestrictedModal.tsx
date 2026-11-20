import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  AlertTriangle,
  LogOut,
  ArrowRight,
  X,
  Store,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const BusinessRestrictedModal: React.FC = () => {
  const { user, logout } = useAuth();
  const { isBusinessModalOpen, businessModalData, closeBusinessModal, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isBusinessModalOpen || !user || user.role !== 'company') {
    return null;
  }

  const handleLogoutAndSignIn = async () => {
    closeBusinessModal();
    try {
      await clearCart();
    } catch {
      // ignore
    }
    await logout();
    navigate('/login');
  };

  const handleLogoutAndBrowse = async () => {
    closeBusinessModal();
    try {
      await clearCart();
    } catch {
      // ignore
    }
    await logout();
    if (location.pathname.startsWith('/business')) {
      navigate('/');
    }
  };

  const handleGoToMerchantDashboard = () => {
    closeBusinessModal();
    navigate('/business');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none font-satoshi animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1E1E1E]/80 backdrop-blur-xs"
        onClick={closeBusinessModal}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#E4E2DD] border-2 border-[#1E1E1E] shadow-2xl z-10 animate-in zoom-in-95 duration-200">
        <div className="h-1.5 bg-[#DB4A2B] w-full" />

        {/* Header */}
        <div className="p-6 sm:p-7 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#1E1E1E] text-[#E4E2DD] flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-[#DB4A2B]" />
              </div>
              <div>
                <span className="px-2 py-0.5 bg-[#1E1E1E] text-[#E4E2DD] text-[10px] font-mono font-bold uppercase tracking-widest">
                  MERCHANT SESSION ACTIVE
                </span>
                <h3 className="font-clash text-lg font-bold text-[#1E1E1E] uppercase tracking-tight mt-1">
                  ORDERING PERMISSION RESTRICTED
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={closeBusinessModal}
              className="p-1.5 text-[#1E1E1E] hover:text-[#DB4A2B] transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Business Account Details Box */}
          <div className="mt-5 p-3.5 bg-[#FFFFFF] border border-[#1E1E1E]/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Store className="w-4 h-4 text-[#DB4A2B] shrink-0" />
              <div className="min-w-0 text-left">
                <div className="text-xs font-bold text-[#1E1E1E] uppercase truncate">
                  {user.companyName || user.name}
                </div>
                <div className="text-[10px] font-mono text-[#444444] truncate">
                  {user.email} &bull; SELLER ARCHIVE
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-[#D9D6D0] text-[#1E1E1E] shrink-0">
              SELLER ROLE
            </span>
          </div>

          {/* Explanation Body */}
          <div className="mt-4 p-4 border border-[#DB4A2B]/30 bg-[#DB4A2B]/5 text-xs text-[#1E1E1E] space-y-2 text-left">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#DB4A2B] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {businessModalData?.reason ||
                  'Seller accounts cannot place retail consumer orders. To complete checkout or test order fulfillment, sign in with a standard shopper account.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 sm:p-7 pt-2 space-y-2.5">
          <button
            type="button"
            onClick={handleLogoutAndSignIn}
            className="w-full raw-btn py-3.5 px-4 text-xs font-bold uppercase tracking-widest text-[#E4E2DD] bg-[#1E1E1E] border border-[#1E1E1E] hover:text-[#DB4A2B] flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>SIGN OUT & LOGIN AS CUSTOMER</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleGoToMerchantDashboard}
              className="py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-[#1E1E1E] bg-[#FFFFFF] border border-[#1E1E1E]/30 hover:border-[#1E1E1E] transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Building2 className="w-4 h-4 text-[#DB4A2B]" />
              <span>MERCHANT HUB</span>
            </button>

            <button
              type="button"
              onClick={handleLogoutAndBrowse}
              className="py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-[#444444] hover:text-[#1E1E1E] transition cursor-pointer flex items-center justify-center gap-1"
            >
              <span>BROWSE AS GUEST</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessRestrictedModal;
