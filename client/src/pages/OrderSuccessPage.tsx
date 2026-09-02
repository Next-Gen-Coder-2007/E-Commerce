import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  Truck,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as { orderId?: string; totalAmount?: number } | undefined;

  const orderId = state?.orderId;
  const totalAmount = state?.totalAmount || 0;

  if (!orderId) {
    return <Navigate to="/orders" replace />;
  }

  // Estimated delivery: 3 business days from now
  const estDelivery = new Date();
  estDelivery.setDate(estDelivery.getDate() + 3);
  const formattedDelivery = estDelivery.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto flex flex-col justify-center">
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-8 sm:p-12 shadow-xl shadow-zinc-950/5 text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Top Success Badge */}
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            Payment & Saga Verified
          </span>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 mt-2">
            Order Successfully Placed!
          </h1>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Thank you for your purchase. We've reserved your stock and dispatched notifications to our merchant fulfillment hubs.
          </p>
        </div>

        {/* Order Details Summary Box */}
        <div className="p-5 bg-zinc-50 border border-zinc-200/60 rounded-2xl text-left space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200/60 text-xs">
            <div>
              <span className="text-zinc-400 font-medium">Order Reference:</span>
              <span className="font-mono font-bold text-zinc-900 ml-1.5">{orderId}</span>
            </div>
            {totalAmount > 0 && (
              <div>
                <span className="text-zinc-400 font-medium">Total Paid:</span>
                <span className="font-mono font-black text-emerald-600 ml-1.5">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-zinc-900">Estimated Delivery</div>
                <div className="text-zinc-500">{formattedDelivery}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-zinc-900">Buyer Protection</div>
                <div className="text-zinc-500">100% Covered with 30-Day Returns</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to={`/orders/${orderId}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs shadow-md shadow-zinc-950/10 transition active:scale-95"
          >
            <Package className="w-4 h-4" />
            <span>Track Order & Saga Timeline</span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs transition active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
