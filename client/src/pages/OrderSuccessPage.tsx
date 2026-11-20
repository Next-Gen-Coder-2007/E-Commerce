import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  Truck,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { RawAtmosphere } from '../components/RawAtmosphere';
import { BrutalistButton } from '../components/BrutalistButton';

export const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as { orderId?: string; totalAmount?: number } | undefined;

  const orderId = state?.orderId;
  const totalAmount = state?.totalAmount || 0;

  if (!orderId) {
    return <Navigate to="/orders" replace />;
  }

  const estDelivery = new Date();
  estDelivery.setDate(estDelivery.getDate() + 3);
  const formattedDelivery = estDelivery.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-[85vh] py-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto flex flex-col justify-center font-satoshi text-[#1E1E1E] select-none relative">
      <RawAtmosphere variant="vibrant" />

      <div className="bg-[#FFFFFF] border-2 border-[#1E1E1E] p-8 sm:p-12 shadow-2xl text-center space-y-8">
        {/* Top Success Badge */}
        <div className="w-16 h-16 bg-[#1E1E1E] text-[#E4E2DD] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-[#1E1E1E] text-[#E4E2DD] text-[10px] font-mono font-bold uppercase tracking-widest">
            SAGA TRANSACTION COMMITTED
          </span>
          <h1 className="font-clash text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#1E1E1E]">
            ORDER CONFIRMED
          </h1>
          <p className="text-xs text-[#444444] max-w-md mx-auto leading-relaxed">
            Your requisition has been committed to the distributed outbox and transmitted to verified supplier fulfillment desks.
          </p>
        </div>

        {/* Order Details Receipt Box */}
        <div className="p-6 bg-[#E4E2DD]/40 border-2 border-[#1E1E1E] text-left space-y-4 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1E1E1E]/20">
            <div>
              <span className="text-[#444444] uppercase">ORDER REFERENCE:</span>
              <span className="font-bold text-[#1E1E1E] ml-2">{orderId}</span>
            </div>
            {totalAmount > 0 && (
              <div>
                <span className="text-[#444444] uppercase">SETTLEMENT:</span>
                <span className="font-bold text-[#DB4A2B] ml-2">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1E1E1E] text-[#E4E2DD] flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-[#DB4A2B]" />
              </div>
              <div>
                <div className="font-bold text-[#1E1E1E] uppercase">ESTIMATED COURIER</div>
                <div className="text-[11px] text-[#444444]">{formattedDelivery}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1E1E1E] text-[#E4E2DD] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="font-bold text-[#1E1E1E] uppercase">BUYER PROTOCOL</div>
                <div className="text-[11px] text-[#444444]">30-DAY SAGA REFUND</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to={`/orders/${orderId}`}
            className="raw-btn px-6 py-3 bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E] text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            <span>TRACK DISPATCH TELEMETRY</span>
          </Link>

          <Link
            to="/"
            className="px-6 py-3 bg-[#FFFFFF] hover:bg-[#1E1E1E] hover:text-[#E4E2DD] text-[#1E1E1E] border border-[#1E1E1E] text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>RETURN TO ARCHIVE</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
