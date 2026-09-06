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
    // Redirect to customer login page (NOT business login)
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
    // Stay on marketplace or go to homepage as customer/guest
    if (location.pathname.startsWith('/business')) {
      navigate('/');
    }
  };

  const handleGoToMerchantDashboard = () => {
    closeBusinessModal();
    navigate('/business');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs"
        onClick={closeBusinessModal}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Top Accent Stripe */}
        <div className="h-1 bg-amber-500 w-full" />

        {/* Header */}
        <div className="p-6 sm:p-7 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
                    Business Account Active
                  </span>
                </div>
                <h3 className="text-lg font-black text-zinc-950 tracking-tight mt-0.5">
                  Cart & Ordering Disabled
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={closeBusinessModal}
              className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              title="Close Dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Business Account Details Box */}
          <div className="mt-4 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-extrabold text-zinc-900 truncate">
                  {user.companyName || user.name}
                </p>
                <p className="text-[11px] text-zinc-500 font-mono truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-zinc-200/80 text-zinc-700 shrink-0">
              Merchant Role
            </span>
          </div>

          {/* Description */}
          <div className="mt-4 space-y-2.5 text-xs text-zinc-600 leading-relaxed">
            <p>
              You are logged in with your business account. Shopping cart and ordering services are reserved for customer accounts and are disabled for company/seller accounts.
            </p>
            <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>To add products and make purchases:</span>
              </p>
              <p className="text-[11px] text-amber-900 pl-5.5">
                Please log out from this business account. You will then be able to add items and order as a customer or guest.
              </p>
            </div>
            {businessModalData?.productTitle && (
              <p className="text-[11px] text-zinc-500 italic">
                Product: &ldquo;{businessModalData.productTitle}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-3 bg-zinc-50/70 border-t border-zinc-100 flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={handleLogoutAndBrowse}
              className="w-full sm:flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-zinc-900 bg-white hover:bg-zinc-100 border border-zinc-200/90 transition-all active:scale-[0.98] shadow-2xs cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Log Out & Shop as Guest</span>
            </button>

            <button
              type="button"
              onClick={handleLogoutAndSignIn}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-zinc-950 hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-md cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out & Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60">
            <button
              type="button"
              onClick={handleGoToMerchantDashboard}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <Building2 className="w-3 h-3" />
              <span>Go to Merchant Dashboard</span>
            </button>

            <button
              type="button"
              onClick={closeBusinessModal}
              className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              Stay on Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
