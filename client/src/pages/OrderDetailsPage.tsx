import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Copy,
  Check,
  CreditCard,
  MapPin,
  Printer,
  Sparkles,
  Building2,
  Calendar,
  XCircle,
  X,
  Star,
} from 'lucide-react';
import { getOrderByIdApi, payOrderApi } from '../services/orderService';
import { getMyReviewedProductIdsApi } from '../services/reviewService';
import { Order, OrderStatus } from '../types/order';
import { CancelOrderModal } from '../components/CancelOrderModal';
import { WriteReviewModal } from '../components/reviews/WriteReviewModal';

const STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'placed', label: 'Order Placed', desc: 'Order details received' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Payment verified' },
  { key: 'processing', label: 'Processing', desc: 'Packed at fulfillment center' },
  { key: 'shipped', label: 'In Transit', desc: 'Handed over to carrier' },
  { key: 'delivered', label: 'Delivered', desc: 'Package arrived at destination' },
];

const getStepIndex = (status: OrderStatus) => {
  switch (status) {
    case 'placed':
      return 0;
    case 'confirmed':
      return 1;
    case 'processing':
      return 2;
    case 'shipped':
    case 'out_for_delivery':
      return 3;
    case 'delivered':
      return 4;
    case 'cancelled':
    case 'refunded':
      return -1;
    default:
      return 0;
  }
};

export const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isNewOrder = searchParams.get('success') === 'true';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [paying, setPaying] = useState(false);
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>([]);
  const [reviewTarget, setReviewTarget] = useState<{
    productId: string;
    productTitle: string;
    productImage?: string;
    orderId: string;
  } | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(isNewOrder);
  const [successProgress, setSuccessProgress] = useState(100);

  useEffect(() => {
    if (isNewOrder) {
      setShowSuccessBanner(true);
      const startTime = Date.now();
      const totalDuration = 7000;

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / totalDuration) * 100);
        setSuccessProgress(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 50);

      const timer = setTimeout(() => {
        setShowSuccessBanner(false);
      }, totalDuration);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [isNewOrder]);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getOrderByIdApi(id);
      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        throw new Error(res.message || 'Order not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReviewedStatus = useCallback(async () => {
    try {
      const res = await getMyReviewedProductIdsApi();
      if (res.success) {
        setReviewedProductIds(res.productIds || []);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    fetchOrder();
    fetchReviewedStatus();
  }, [fetchOrder, fetchReviewedStatus]);

  const handleCopyOrderNumber = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyTracking = () => {
    if (order?.fulfillment?.trackingNumber) {
      navigator.clipboard.writeText(order.fulfillment.trackingNumber);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  const handlePayNow = async () => {
    if (!order) return;
    try {
      setPaying(true);
      await payOrderApi(order._id, { paymentMethod: 'mock_instant' });
      await fetchOrder();
    } catch (err: any) {
      alert(err.message || 'Payment simulation failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-zinc-950 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-zinc-500 font-mono">Loading Order Details...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-zinc-950">Order Not Found</h2>
        <p className="text-xs text-zinc-600">
          {error || "The requested order could not be retrieved or you don't have permission to view it."}
        </p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 transition-all shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Orders</span>
        </Link>
      </div>
    );
  }

  const effectiveStatus = (order.orderStatus || order.status || 'placed') as OrderStatus;
  const currentStep = getStepIndex(effectiveStatus);
  const isCancelled = effectiveStatus === 'cancelled';
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const estimatedDelivery = order.fulfillment?.estimatedDelivery
    ? new Date(order.fulfillment.estimatedDelivery).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : 'In 3 - 5 business days';

  return (
    <div className="min-h-screen bg-zinc-50/70 pb-20 pt-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200/80">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Orders</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>

        {/* Success Banner if newly checked out */}
        {showSuccessBanner && (
          <div className="relative overflow-hidden p-5 rounded-3xl bg-zinc-950 text-white shadow-xl space-y-2 border border-zinc-800 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Order Placed Successfully!
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSuccessBanner(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Dismiss message"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-300">
              A confirmation email has been dispatched to <strong>{order.customer.email}</strong>. You can monitor live fulfillment and tracking below.
            </p>

            {/* Countdown progress line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-75 ease-linear"
                style={{ width: `${successProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Order Main Header Card */}
        <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-zinc-950">
                  Order {order.orderNumber}
                </h1>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  className="p-1 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                  title="Copy Order ID"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="text-xs text-zinc-500 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Placed on {orderDate}</span>
              </div>
            </div>

            {/* Quick Action: Pay or Cancel */}
            <div className="flex items-center gap-2">
              {order.paymentInfo.status === 'pending' && !isCancelled && (
                <button
                  type="button"
                  disabled={paying}
                  onClick={handlePayNow}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                >
                  {paying ? 'Processing...' : 'Pay Now'}
                </button>
              )}
              {!isCancelled &&
                ['placed', 'confirmed', 'processing'].includes(effectiveStatus) && (
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
            </div>
          </div>

          {/* Stepper Progress Bar */}
          {!isCancelled ? (
            <div className="pt-4 space-y-6">
              <div className="relative">
                {/* Horizontal Progress Line */}
                <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-zinc-100 -translate-y-1/2 z-0" />
                <div
                  className="hidden sm:block absolute top-1/2 left-0 h-1 bg-zinc-950 -translate-y-1/2 z-0 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (currentStep / (STEPS.length - 1)) * 100)}%`,
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                  {STEPS.map((step, idx) => {
                    const isDone = idx <= currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div
                        key={step.key}
                        className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2"
                      >
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all shadow-xs shrink-0 ${
                            isCurrent
                              ? 'bg-zinc-950 text-white ring-4 ring-zinc-950/10'
                              : isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div className="sm:text-center">
                          <span
                            className={`text-xs font-extrabold block ${
                              isCurrent
                                ? 'text-zinc-950'
                                : isDone
                                ? 'text-zinc-800'
                                : 'text-zinc-400'
                            }`}
                          >
                            {step.label}
                          </span>
                          <span className="text-[10px] text-zinc-400 block leading-tight">
                            {step.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs font-medium">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <strong>This order was cancelled.</strong>
                {order.cancellation?.cancelReason && (
                  <span> Reason: {order.cancellation.cancelReason}</span>
                )}
              </div>
            </div>
          )}

          {/* Fulfillment Tracking Sub-Card */}
          {order.fulfillment?.trackingNumber && (
            <div className="mt-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 shadow-2xs">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                    Courier Tracking Code
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-zinc-950">
                      {order.fulfillment.carrier} ({order.fulfillment.trackingNumber})
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTracking}
                      className="p-1 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                      title="Copy Tracking ID"
                    >
                      {copiedTracking ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                  Estimated Delivery
                </span>
                <span className="text-xs font-extrabold text-emerald-700">
                  {estimatedDelivery}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Items List (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-zinc-950 uppercase tracking-wider pb-3 border-b border-zinc-100">
                Ordered Items ({order.orderItems.length})
              </h3>

              <div className="divide-y divide-zinc-100">
                {order.orderItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-200/80 overflow-hidden shrink-0 p-1 flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-zinc-400" />
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <Link
                          to={`/product/${item.productId}`}
                          className="text-xs sm:text-sm font-bold text-zinc-900 hover:text-indigo-600 truncate block transition-colors"
                        >
                          {item.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                          {item.companyName && (
                            <span className="inline-flex items-center gap-1 font-semibold text-zinc-600">
                              <Building2 className="w-3 h-3" />
                              {item.companyName}
                            </span>
                          )}
                          <span>•</span>
                          <span className="capitalize">{item.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-black font-mono text-zinc-950">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          ${item.price.toFixed(2)} × {item.quantity}
                        </div>
                      </div>
                      {!order.cancellation?.isCancelled && (
                        reviewedProductIds.includes(item.productId) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 shadow-2xs">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Verified Review Submitted</span>
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-[11px] font-bold text-amber-900 transition-colors shadow-2xs cursor-pointer"
                            title="Write Verified Customer Review"
                          >
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>Write Review</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Status History Timeline */}
            <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-zinc-950 uppercase tracking-wider pb-3 border-b border-zinc-100">
                Status History & Activity
              </h3>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
                {order.statusHistory.map((hist, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-zinc-950 border-2 border-white shadow-xs" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 capitalize">
                          {hist.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(hist.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {hist.note && (
                        <p className="text-[11px] text-zinc-600">{hist.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Shipping & Payment Summary (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Delivery Address Card */}
            <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-zinc-950 font-black text-xs uppercase tracking-wider pb-2 border-b border-zinc-100">
                <MapPin className="w-4 h-4 text-zinc-700" />
                <span>Shipping Address</span>
              </div>
              <div className="text-xs text-zinc-600 space-y-1 leading-relaxed">
                <p className="font-extrabold text-zinc-900">
                  {order.shippingAddress.fullName}
                </p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p className="text-zinc-500 pt-1">
                    Phone: {order.shippingAddress.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Payment & Invoice Breakdown */}
            <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-zinc-950 font-black text-xs uppercase tracking-wider pb-2 border-b border-zinc-100">
                <CreditCard className="w-4 h-4 text-zinc-700" />
                <span>Payment & Charges</span>
              </div>

              <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-100">
                <span className="text-zinc-500">Method</span>
                <span className="font-bold text-zinc-900 uppercase">
                  {order.paymentInfo.method}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-100">
                <span className="text-zinc-500">Payment Status</span>
                <span
                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                    order.paymentInfo.status === 'paid'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {order.paymentInfo.status}
                </span>
              </div>

              <div className="space-y-2 text-xs text-zinc-600 pt-1">
                <div className="flex items-center justify-between">
                  <span>Items Total</span>
                  <span className="font-mono font-semibold text-zinc-900">
                    ${order.pricing?.itemsPrice?.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span className="font-mono font-semibold text-zinc-900">
                    {order.pricing?.shippingPrice === 0
                      ? 'FREE'
                      : `$${order.pricing?.shippingPrice?.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sales Tax</span>
                  <span className="font-mono font-semibold text-zinc-900">
                    ${order.pricing?.taxPrice?.toFixed(2)}
                  </span>
                </div>

                {order.pricing?.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 font-semibold">
                    <span>Discount</span>
                    <span className="font-mono">
                      -${order.pricing.discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-sm font-black text-zinc-950">
                  <span>Total Amount</span>
                  <span className="text-base font-black font-mono">
                    ${order.pricing?.totalPrice?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CancelOrderModal
        order={order}
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onSuccess={() => fetchOrder()}
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
  );
};
