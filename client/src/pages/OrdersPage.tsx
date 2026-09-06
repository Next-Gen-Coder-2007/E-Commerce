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

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'placed':
      return {
        label: 'Order Placed',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'confirmed':
      return {
        label: 'Payment Confirmed',
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        dot: 'bg-sky-500',
      };
    case 'processing':
      return {
        label: 'In Preparation',
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dot: 'bg-indigo-500',
      };
    case 'shipped':
      return {
        label: 'In Transit',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'out_for_delivery':
      return {
        label: 'Out for Delivery',
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        dot: 'bg-purple-500',
      };
    case 'delivered':
      return {
        label: 'Delivered',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
      };
    default:
      return {
        label: status,
        bg: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        dot: 'bg-zinc-400',
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
      setError(err.message || 'Failed to retrieve your order history');
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
    <div className="min-h-screen bg-zinc-50/70 pb-20 pt-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Business Account Banner */}
        {user?.role === 'company' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <p className="text-xs font-bold">
                  Business Account Active ({user.companyName || user.name})
                </p>
                <p className="text-[11px] text-amber-800">
                  This page displays customer retail orders. To manage your seller orders & inventory, visit your Merchant Dashboard.
                </p>
              </div>
            </div>
            <Link
              to="/business"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-transform active:scale-95 shadow-xs shrink-0 self-start sm:self-center"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Merchant Dashboard</span>
            </Link>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight flex items-center gap-2.5">
              <Package className="w-7 h-7" />
              <span>My Orders</span>
              {totalOrders > 0 && (
                <span className="text-base font-bold text-zinc-400">({totalOrders})</span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500">
              Track live packages, review past purchases, and manage returns & receipts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchOrders()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 transition-all shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Shop More</span>
            </Link>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'active', label: 'Active Shipments' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80 border border-zinc-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-44 rounded-2xl bg-white border border-zinc-200/80 animate-pulse p-6"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-white border border-rose-200 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <div className="text-sm font-bold text-zinc-900">{error}</div>
            <button
              type="button"
              onClick={() => fetchOrders()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-zinc-950"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-12 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400">
              <Package className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-zinc-950">No orders found</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {statusFilter !== 'all'
                  ? `You don't have any orders matching the "${statusFilter}" status filter.`
                  : "You haven't placed any orders yet. Once you complete checkout, your order updates will appear here."}
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 transition-all shadow-xs"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const currentStatus = (order.orderStatus || order.status || 'placed') as OrderStatus;
              const badge = getStatusBadge(currentStatus);
              const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              const isCancellable =
                !order.cancellation?.isCancelled &&
                ['placed', 'confirmed', 'processing'].includes(currentStatus);

              return (
                <div
                  key={order._id}
                  className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 hover:border-zinc-300 transition-all"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                          Order Number
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-zinc-950">
                            {order.orderNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(order.orderNumber, order._id)}
                            className="text-zinc-400 hover:text-zinc-700 p-1 transition-colors cursor-pointer"
                            title="Copy Order ID"
                          >
                            {copiedId === order._id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="h-6 w-px bg-zinc-200 hidden sm:block" />

                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                          Date Placed
                        </span>
                        <span className="text-xs font-semibold text-zinc-800">
                          {orderDate}
                        </span>
                      </div>

                      <div className="h-6 w-px bg-zinc-200 hidden sm:block" />

                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                          Total Amount
                        </span>
                        <span className="text-xs font-black font-mono text-zinc-950">
                          ${order.pricing?.totalPrice?.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        <span>{badge.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-8 flex flex-wrap items-center gap-3">
                      {order.orderItems.slice(0, 4).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 p-2 rounded-2xl bg-zinc-50 border border-zinc-200/70 max-w-[260px]"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-[11px] font-bold text-zinc-900 truncate">
                              {item.title}
                            </h5>
                            <div className="flex items-center justify-between gap-1 mt-0.5">
                              <span className="text-[10px] text-zinc-500 font-mono">
                                ${item.price.toFixed(2)} × {item.quantity}
                              </span>
                              {!order.cancellation?.isCancelled && (
                                reviewedProductIds.includes(item.productId) ? (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[9px] font-bold text-emerald-700">
                                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Reviewed</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReviewTarget({
                                        productId: item.productId,
                                        productTitle: item.title,
                                        productImage: item.image,
                                        orderId: order._id,
                                      })
                                    }
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[9px] font-bold text-amber-900 transition-colors cursor-pointer"
                                    title="Write Verified Customer Review"
                                  >
                                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                    <span>Review</span>
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {order.orderItems.length > 4 && (
                        <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-2 rounded-xl">
                          +{order.orderItems.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-4 flex items-center justify-end gap-2">
                      {isCancellable && (
                        <button
                          type="button"
                          onClick={() => setCancelModalOrder(order)}
                          className="px-3 py-2 rounded-xl border border-zinc-200 hover:border-rose-300 hover:bg-rose-50 text-xs font-semibold text-zinc-600 hover:text-rose-700 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <Link
                        to={`/orders/${order._id}`}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 shadow-xs transition-transform active:scale-[0.98]"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Live Tracking snippet */}
                  {order.fulfillment?.trackingNumber && (
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-zinc-600" />
                        <span>Carrier: <strong className="text-zinc-900">{order.fulfillment.carrier || 'NovaExpress'}</strong></span>
                        <span>•</span>
                        <span className="font-mono text-zinc-700 font-semibold">{order.fulfillment.trackingNumber}</span>
                      </div>
                      <Link
                        to={`/orders/${order._id}#tracking`}
                        className="text-indigo-600 hover:underline font-bold"
                      >
                        Live Tracking & Timeline →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs font-medium text-zinc-500 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Multi-Step Cancellation Modal */}
        <CancelOrderModal
          order={cancelModalOrder}
          isOpen={Boolean(cancelModalOrder)}
          onClose={() => setCancelModalOrder(null)}
          onSuccess={() => fetchOrders()}
        />

        {/* Verified Review Modal */}
        {reviewTarget && (
          <WriteReviewModal
            isOpen={Boolean(reviewTarget)}
            onClose={() => setReviewTarget(null)}
            productId={reviewTarget.productId}
            productTitle={reviewTarget.productTitle}
            productImage={reviewTarget.productImage}
            orderId={reviewTarget.orderId}
            onReviewSaved={(savedReview) => {
              setReviewedProductIds((prev) =>
                prev.includes(savedReview.productId) ? prev : [...prev, savedReview.productId]
              );
              setReviewTarget(null);
            }}
          />
        )}
      </div>
    </div>
  );
};
