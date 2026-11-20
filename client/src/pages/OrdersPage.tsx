import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Truck,
  AlertCircle,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  Building2,
  Star,
} from 'lucide-react';
import { getMyOrdersApi } from '../services/orderService';
import { getMyReviewedProductIdsApi } from '../services/reviewService';
import { Order, OrderStatus } from '../types/order';
import { CancelOrderModal } from '../components/CancelOrderModal';
import { WriteReviewModal } from '../components/reviews/WriteReviewModal';
import { useAuth } from '../context/AuthContext';
import { RawAtmosphere } from '../components/RawAtmosphere';
import { BrutalistButton } from '../components/BrutalistButton';

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'placed':
      return {
        label: 'ORDER PLACED',
        bg: 'bg-[#1E1E1E] text-[#E4E2DD]',
        border: 'border-[#1E1E1E]',
      };
    case 'confirmed':
      return {
        label: 'PAYMENT CONFIRMED',
        bg: 'bg-[#FFFFFF] text-[#1E1E1E]',
        border: 'border-[#1E1E1E]',
      };
    case 'processing':
      return {
        label: 'IN PREPARATION',
        bg: 'bg-[#F8A348] text-[#1E1E1E]',
        border: 'border-[#1E1E1E]',
      };
    case 'shipped':
      return {
        label: 'IN TRANSIT',
        bg: 'bg-[#1E1E1E] text-[#F8A348]',
        border: 'border-[#1E1E1E]',
      };
    case 'out_for_delivery':
      return {
        label: 'OUT FOR DELIVERY',
        bg: 'bg-[#FF89A9] text-[#1E1E1E]',
        border: 'border-[#1E1E1E]',
      };
    case 'delivered':
      return {
        label: 'DELIVERED',
        bg: 'bg-[#1E1E1E] text-[#FFFFFF]',
        border: 'border-[#1E1E1E]',
      };
    case 'cancelled':
      return {
        label: 'CANCELLED',
        bg: 'bg-[#DB4A2B] text-[#FFFFFF]',
        border: 'border-[#DB4A2B]',
      };
    default:
      return {
        label: String(status).toUpperCase(),
        bg: 'bg-[#D9D6D0] text-[#1E1E1E]',
        border: 'border-[#1E1E1E]/30',
      };
  }
};

export const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>([]);
  const [reviewTarget, setReviewTarget] = useState<{
    productId: string;
    productTitle: string;
    productImage?: string;
    orderId: string;
  } | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyOrdersApi({
        page,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      if (res.success) {
        setOrders(res.orders || []);
        setTotalPages(res.pages || 1);
        setTotalOrders(res.total || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve order history');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  const fetchReviewedStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getMyReviewedProductIdsApi();
      if (res.success) {
        setReviewedProductIds(res.productIds || []);
      }
    } catch {
      // Non-blocking
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
    fetchReviewedStatus();
  }, [fetchOrders, fetchReviewedStatus]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#E4E2DD] text-[#1E1E1E] font-satoshi py-10 px-4 sm:px-6 lg:px-10 relative select-none">
      <RawAtmosphere variant="subtle" />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Business Account Banner */}
        {user?.role === 'company' && (
          <div className="p-4 bg-[#F8A348]/20 border-2 border-[#1E1E1E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-[#DB4A2B] shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase">
                  MERCHANT SESSION ACTIVE ({user.companyName || user.name})
                </p>
                <p className="text-[11px] text-[#444444]">
                  This section catalogs your retail purchases. To manage supplier orders & merchant stock, open the Merchant Hub.
                </p>
              </div>
            </div>
            <Link
              to="/business"
              className="px-4 py-2 bg-[#1E1E1E] text-[#E4E2DD] text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#DB4A2B] transition-colors shrink-0"
            >
              MERCHANT HUB →
            </Link>
          </div>
        )}

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b-2 border-[#1E1E1E]">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#DB4A2B] block">
              DISPATCH REQUISITIONS & FULFILLMENT
            </span>
            <h1 className="font-clash text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#1E1E1E] mt-0.5">
              ORDER ARCHIVE
            </h1>
            <p className="text-xs text-[#444444] font-mono uppercase mt-1">
              TOTAL RECORDED ORDERS: {totalOrders} &bull; TRACK TELEMETRY & SAGAS
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            {['all', 'placed', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 uppercase font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#1E1E1E] text-[#E4E2DD]'
                    : 'bg-[#FFFFFF] border border-[#1E1E1E]/20 text-[#1E1E1E] hover:border-[#1E1E1E]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 border-2 border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#DB4A2B] text-xs font-mono font-bold uppercase flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Orders Listing */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-6 bg-[#FFFFFF] border border-[#1E1E1E]/20 space-y-3 animate-pulse font-mono">
                <div className="h-4 bg-[#E4E2DD] w-1/4" />
                <div className="h-10 bg-[#E4E2DD] w-full" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 bg-[#FFFFFF] border-2 border-[#1E1E1E] p-8 space-y-4">
            <Package className="w-12 h-12 text-[#444444] mx-auto" />
            <h3 className="font-clash text-xl font-bold uppercase tracking-tight text-[#1E1E1E]">
              NO ORDER DISPATCHES RECORDED
            </h3>
            <p className="text-xs text-[#444444] max-w-sm mx-auto">
              You haven&apos;t placed any orders matching this filter yet. Explore the catalog to start shopping.
            </p>
            <Link
              to="/"
              className="inline-block raw-btn px-8 py-3.5 bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E] text-xs font-bold uppercase tracking-widest"
            >
              EXPLORE CATALOG
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((ord) => {
              const badge = getStatusBadge(ord.status);
              const formattedDate = new Date(ord.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <article
                  key={ord._id}
                  className="bg-[#FFFFFF] border-2 border-[#1E1E1E] p-6 sm:p-8 space-y-6 group hover:border-[#DB4A2B] transition-colors"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E1E1E]/15 font-mono text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1E1E1E]">
                          ORDER REF: {ord.orderNumber || ord._id.slice(-8).toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(ord.orderNumber || ord._id, ord._id)}
                          className="text-[#444444] hover:text-[#DB4A2B] cursor-pointer"
                          title="Copy reference"
                        >
                          {copiedId === ord._id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <span className="text-[10px] text-[#444444]">
                        DISPATCH RECORDED: {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase border ${badge.bg} ${badge.border}`}>
                        {badge.label}
                      </span>
                      <span className="font-clash text-lg font-bold text-[#1E1E1E]">
                        ${ord.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Items Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ord.orderItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-[#E4E2DD]/30 border border-[#1E1E1E]/15"
                      >
                        <div className="w-12 h-14 bg-[#FFFFFF] border border-[#1E1E1E]/20 shrink-0 p-1 flex items-center justify-center">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-clash text-xs font-bold uppercase text-[#1E1E1E] truncate">
                            {item.title}
                          </h4>
                          <div className="text-[10px] font-mono text-[#444444]">
                            QTY: {item.quantity} &bull; ${item.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Footer */}
                  <div className="pt-4 border-t border-[#1E1E1E]/15 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                    <span className="text-[#444444]">
                      SHIPPED TO: <strong className="text-[#1E1E1E] uppercase">{ord.shippingAddress?.fullName || user?.name}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      {ord.status === 'placed' && (
                        <button
                          type="button"
                          onClick={() => setCancelModalOrder(ord)}
                          className="px-3 py-1.5 border border-[#DB4A2B] text-[#DB4A2B] text-[11px] font-bold uppercase hover:bg-[#DB4A2B] hover:text-[#FFFFFF] transition cursor-pointer"
                        >
                          CANCEL ORDER
                        </button>
                      )}
                      <Link
                        to={`/orders/${ord._id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E1E1E] hover:bg-[#DB4A2B] text-[#E4E2DD] text-[11px] font-bold uppercase tracking-wider transition-colors"
                      >
                        <span>VIEW DETAILS & TRACKING</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6 font-mono text-xs">
            {Array.from({ length: totalPages }).map((_, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => setPage(pIdx + 1)}
                className={`w-9 h-9 font-bold transition cursor-pointer ${
                  page === pIdx + 1
                    ? 'bg-[#1E1E1E] text-[#E4E2DD]'
                    : 'bg-[#FFFFFF] border border-[#1E1E1E]/30 text-[#1E1E1E] hover:border-[#1E1E1E]'
                }`}
              >
                {pIdx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      {cancelModalOrder && (
        <CancelOrderModal
          order={cancelModalOrder}
          isOpen={Boolean(cancelModalOrder)}
          onClose={() => setCancelModalOrder(null)}
          onCancelled={() => {
            setCancelModalOrder(null);
            fetchOrders();
          }}
        />
      )}

      {/* Write Review Modal */}
      {reviewTarget && (
        <WriteReviewModal
          isOpen={Boolean(reviewTarget)}
          onClose={() => setReviewTarget(null)}
          productId={reviewTarget.productId}
          productTitle={reviewTarget.productTitle}
          productImage={reviewTarget.productImage}
          orderId={reviewTarget.orderId}
          onReviewSaved={() => {
            setReviewTarget(null);
            fetchReviewedStatus();
          }}
        />
      )}
    </div>
  );
};

export default OrdersPage;
