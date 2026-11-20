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
  ExternalLink,
} from 'lucide-react';
import { getOrderByIdApi, payOrderApi } from '../services/orderService';
import { getMyReviewedProductIdsApi } from '../services/reviewService';
import { Order, OrderStatus } from '../types/order';
import { CancelOrderModal } from '../components/CancelOrderModal';
import { WriteReviewModal } from '../components/reviews/WriteReviewModal';
import { BrutalistButton } from '../components/BrutalistButton';

const STEPS: { key: OrderStatus; label: string; desc: string; code: string }[] = [
  { key: 'placed', label: 'ORDER PLACED', desc: 'Payload received & queued', code: '01' },
  { key: 'confirmed', label: 'CONFIRMED', desc: 'Payment escrow verified', code: '02' },
  { key: 'processing', label: 'PROCESSING', desc: 'Fulfillment packaging', code: '03' },
  { key: 'shipped', label: 'IN TRANSIT', desc: 'Handed to carrier', code: '04' },
  { key: 'delivered', label: 'DELIVERED', desc: 'Package receipt signed', code: '05' },
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
      <div className="min-h-screen bg-[#E4E2DD] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 border-2 border-[#1E1E1E] bg-white p-8 shadow-[6px_6px_0px_#1E1E1E]">
          <div className="w-10 h-10 border-4 border-[#1E1E1E] border-t-[#DB4A2B] animate-spin" />
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#1E1E1E]">
            LOADING ORDER DETAILS...
          </span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#E4E2DD] py-20 px-4">
        <div className="max-w-xl mx-auto border-2 border-[#1E1E1E] bg-white p-8 shadow-[8px_8px_0px_#1E1E1E] text-center space-y-6">
          <div className="w-16 h-16 border-2 border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#DB4A2B] flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-clash font-bold tracking-tight text-[#1E1E1E] uppercase">
            Order Not Found
          </h2>
          <p className="text-xs font-satoshi text-[#444444] leading-relaxed">
            {error || "The requested order could not be retrieved or you do not have permission to inspect this entry."}
          </p>
          <BrutalistButton to="/orders" variant="primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Return to My Orders</span>
          </BrutalistButton>
        </div>
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
    <div className="min-h-screen bg-[#E4E2DD] text-[#1E1E1E] pb-24 pt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation & Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-2 border-[#1E1E1E]">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#1E1E1E] hover:text-[#DB4A2B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to My Orders</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#1E1E1E] bg-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#1E1E1E] hover:text-[#E4E2DD] transition-all shadow-[3px_3px_0px_#1E1E1E] cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>

        {/* Success Banner if newly placed */}
        {showSuccessBanner && (
          <div className="relative overflow-hidden p-6 border-2 border-[#1E1E1E] bg-[#1E1E1E] text-[#E4E2DD] shadow-[6px_6px_0px_#DB4A2B] space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border border-[#FF89A9] bg-[#FF89A9]/20 text-[#FF89A9] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-[#FF89A9] block">
                    TRANSACTION CONFIRMED // ORDER PLACED
                  </span>
                  <h3 className="text-base sm:text-lg font-clash font-bold tracking-tight text-white uppercase">
                    Order Placed Successfully
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSuccessBanner(false)}
                className="p-1.5 text-zinc-400 hover:text-white border border-zinc-700 hover:border-white transition-colors cursor-pointer"
                title="Dismiss message"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-satoshi text-zinc-300">
              An order confirmation has been sent to <strong className="text-white underline">{order.customer.email}</strong>. Track your order status and shipping below.
            </p>

            {/* Countdown progress line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
              <div
                className="h-full bg-[#DB4A2B] transition-all duration-75 ease-linear"
                style={{ width: `${successProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Order Main Details Card */}
        <div className="border-2 border-[#1E1E1E] bg-white p-6 sm:p-8 shadow-[8px_8px_0px_#1E1E1E] space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b-2 border-[#1E1E1E]">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 bg-[#1E1E1E] text-[#E4E2DD]">
                  ORDER REF
                </span>
                <span className="text-[10px] font-mono text-[#444444]">
                  ID: {order._id.slice(-8)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-clash font-bold tracking-tight text-[#1E1E1E]">
                  ORDER #{order.orderNumber}
                </h1>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  className="p-1.5 border border-[#1E1E1E] hover:bg-[#1E1E1E] hover:text-white transition-colors cursor-pointer"
                  title="Copy Order ID"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-[#DB4A2B]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="text-xs font-mono text-[#444444] flex items-center gap-2 pt-1">
                <Calendar className="w-4 h-4 text-[#1E1E1E]" />
                <span>PLACED ON: {orderDate}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {order.paymentInfo.status === 'pending' && !isCancelled && (
                <BrutalistButton
                  onClick={handlePayNow}
                  loading={paying}
                  variant="primary"
                >
                  Pay Now
                </BrutalistButton>
              )}
              {!isCancelled && ['placed', 'confirmed', 'processing'].includes(effectiveStatus) && (
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="px-4 py-2 border-2 border-[#DB4A2B] text-[#DB4A2B] bg-white hover:bg-[#DB4A2B] hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[3px_3px_0px_#DB4A2B] cursor-pointer"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Raw Brutalist Stepper Progress Bar */}
          {!isCancelled ? (
            <div className="pt-2 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold tracking-wider text-[#444444] uppercase">
                <span>ORDER STATUS & TIMELINE</span>
                <span>STATUS: {effectiveStatus.toUpperCase()}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {STEPS.map((step, idx) => {
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div
                      key={step.key}
                      className={`p-3 border-2 transition-all ${
                        isCurrent
                          ? 'border-[#1E1E1E] bg-[#1E1E1E] text-[#E4E2DD] shadow-[4px_4px_0px_#DB4A2B]'
                          : isDone
                          ? 'border-[#1E1E1E] bg-[#D9D6D0] text-[#1E1E1E]'
                          : 'border-zinc-300 bg-zinc-50 text-zinc-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-mono font-bold ${isCurrent ? 'text-[#FF89A9]' : isDone ? 'text-[#DB4A2B]' : 'text-zinc-400'}`}>
                          {step.code}
                        </span>
                        {isDone && !isCurrent ? (
                          <CheckCircle2 className="w-4 h-4 text-[#DB4A2B]" />
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-[#FF89A9] animate-ping" />
                        ) : null}
                      </div>
                      <div className="text-xs font-clash font-bold uppercase tracking-tight block">
                        {step.label}
                      </div>
                      <div className={`text-[10px] font-satoshi mt-1 leading-tight ${isCurrent ? 'text-zinc-300' : 'text-[#444444]'}`}>
                        {step.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-5 border-2 border-[#DB4A2B] bg-[#DB4A2B]/10 flex items-center gap-4 text-[#1E1E1E]">
              <XCircle className="w-6 h-6 text-[#DB4A2B] shrink-0" />
              <div>
                <strong className="font-clash font-bold uppercase text-sm block">
                  ORDER CANCELLED
                </strong>
                {order.cancellation?.cancelReason && (
                  <span className="text-xs font-mono text-[#444444] block mt-0.5">
                    REASON: {order.cancellation.cancelReason}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Fulfillment Tracking Box */}
          {order.fulfillment?.trackingNumber && (
            <div className="p-4 border-2 border-[#1E1E1E] bg-[#D9D6D0] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border-2 border-[#1E1E1E] bg-white flex items-center justify-center text-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E]">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#444444] block">
                    COURIER SHIPMENT TRACKING
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold text-sm text-[#1E1E1E]">
                      {order.fulfillment.carrier} // {order.fulfillment.trackingNumber}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTracking}
                      className="p-1 border border-[#1E1E1E] bg-white hover:bg-[#1E1E1E] hover:text-white transition-colors cursor-pointer"
                      title="Copy Tracking ID"
                    >
                      {copiedTracking ? (
                        <Check className="w-3.5 h-3.5 text-[#DB4A2B]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#444444] block">
                  ESTIMATED DELIVERY
                </span>
                <span className="text-xs font-clash font-bold text-[#DB4A2B] uppercase">
                  {estimatedDelivery}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Items List & Timeline (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="border-2 border-[#1E1E1E] bg-white p-6 shadow-[6px_6px_0px_#1E1E1E] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#1E1E1E]">
                <h3 className="text-sm font-clash font-bold text-[#1E1E1E] uppercase tracking-wider">
                  ORDERED ITEMS ({order.orderItems.length})
                </h3>
                <span className="text-xs font-mono text-[#444444]">
                  ITEMS LIST
                </span>
              </div>

              <div className="divide-y divide-zinc-200">
                {order.orderItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-5 first:pt-2 last:pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-20 h-24 border-2 border-[#1E1E1E] bg-[#E4E2DD] overflow-hidden shrink-0 flex items-center justify-center p-1">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-[#444444]" />
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <Link
                          to={`/product/${item.productId}`}
                          className="text-sm font-clash font-bold text-[#1E1E1E] hover:text-[#DB4A2B] transition-colors line-clamp-2"
                        >
                          {item.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#444444]">
                          {item.companyName && (
                            <span className="inline-flex items-center gap-1 font-bold text-[#1E1E1E]">
                              <Building2 className="w-3.5 h-3.5" />
                              {item.companyName}
                            </span>
                          )}
                          <span>//</span>
                          <span className="uppercase">{item.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                      <div className="text-left sm:text-right">
                        <div className="text-base font-clash font-bold text-[#1E1E1E]">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        <div className="text-xs font-mono text-[#444444]">
                          ${item.price.toFixed(2)} × {item.quantity}
                        </div>
                      </div>

                      {!order.cancellation?.isCancelled && (
                        reviewedProductIds.includes(item.productId) ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#1E1E1E] bg-[#D9D6D0] text-[10px] font-mono font-bold uppercase tracking-wider text-[#1E1E1E]">
                            <Check className="w-3 h-3 text-[#DB4A2B]" />
                            <span>VERIFIED REVIEW SUBMITTED</span>
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#1E1E1E] bg-[#F8A348] hover:bg-[#1E1E1E] hover:text-white text-[11px] font-mono font-bold uppercase tracking-wider text-[#1E1E1E] transition-all shadow-[2px_2px_0px_#1E1E1E] cursor-pointer"
                            title="Write Verified Customer Review"
                          >
                            <Star className="w-3.5 h-3.5 fill-[#1E1E1E] text-[#1E1E1E]" />
                            <span>Write Review</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Activity & Status History */}
            <div className="border-2 border-[#1E1E1E] bg-white p-6 shadow-[6px_6px_0px_#1E1E1E] space-y-4">
              <h3 className="text-sm font-clash font-bold text-[#1E1E1E] uppercase tracking-wider pb-3 border-b-2 border-[#1E1E1E]">
                ORDER ACTIVITY & STATUS HISTORY
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1E1E1E]">
                {order.statusHistory.map((hist, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 bg-[#DB4A2B] border-2 border-[#1E1E1E]" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-[#1E1E1E] uppercase tracking-wider">
                          {hist.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-[#444444]">
                          {new Date(hist.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {hist.note && (
                        <p className="text-xs font-satoshi text-[#444444] bg-[#E4E2DD] p-2 border border-zinc-300">
                          {hist.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Shipping & Payment Summary (4 Cols) */}
          <div className="lg:col-span-4 space-y-8">
            {/* Delivery Address Card */}
            <div className="border-2 border-[#1E1E1E] bg-white p-6 shadow-[6px_6px_0px_#1E1E1E] space-y-4">
              <div className="flex items-center gap-2 text-[#1E1E1E] font-clash font-bold text-xs uppercase tracking-wider pb-3 border-b-2 border-[#1E1E1E]">
                <MapPin className="w-4 h-4 text-[#DB4A2B]" />
                <span>SHIPPING ADDRESS</span>
              </div>
              <div className="text-xs font-satoshi text-[#444444] space-y-1 leading-relaxed">
                <p className="font-clash font-bold text-sm text-[#1E1E1E] uppercase">
                  {order.shippingAddress.fullName}
                </p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p className="font-mono">
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.postalCode}
                </p>
                <p className="font-mono uppercase">{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p className="font-mono text-[#1E1E1E] pt-2 border-t border-zinc-200">
                    TEL: {order.shippingAddress.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Payment & Charges Breakdown */}
            <div className="border-2 border-[#1E1E1E] bg-white p-6 shadow-[6px_6px_0px_#1E1E1E] space-y-4">
              <div className="flex items-center gap-2 text-[#1E1E1E] font-clash font-bold text-xs uppercase tracking-wider pb-3 border-b-2 border-[#1E1E1E]">
                <CreditCard className="w-4 h-4 text-[#DB4A2B]" />
                <span>PAYMENT & CHARGES</span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-zinc-200">
                <span className="text-[#444444] uppercase">PAYMENT METHOD</span>
                <span className="font-bold text-[#1E1E1E] uppercase">
                  {order.paymentInfo.method}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-zinc-200">
                <span className="text-[#444444] uppercase">PAYMENT STATUS</span>
                <span
                  className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${
                    order.paymentInfo.status === 'paid'
                      ? 'border-[#1E1E1E] bg-[#1E1E1E] text-[#E4E2DD]'
                      : 'border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#DB4A2B]'
                  }`}
                >
                  {order.paymentInfo.status}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono text-[#444444] pt-2">
                <div className="flex items-center justify-between">
                  <span>ITEMS SUB-TOTAL</span>
                  <span className="font-bold text-[#1E1E1E]">
                    ${order.pricing?.itemsPrice?.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>SHIPPING FEE</span>
                  <span className="font-bold text-[#1E1E1E]">
                    {order.pricing?.shippingPrice === 0
                      ? 'FREE'
                      : `$${order.pricing?.shippingPrice?.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>SALES TAX / VAT</span>
                  <span className="font-bold text-[#1E1E1E]">
                    ${order.pricing?.taxPrice?.toFixed(2)}
                  </span>
                </div>

                {order.pricing?.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-[#DB4A2B] font-bold">
                    <span>DISCOUNT COUPON</span>
                    <span>-${order.pricing.discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-4 border-t-2 border-[#1E1E1E] flex items-center justify-between text-[#1E1E1E]">
                  <span className="font-clash font-bold text-sm uppercase">TOTAL PAID</span>
                  <span className="font-clash font-bold text-xl text-[#DB4A2B]">
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

export default OrderDetailsPage;
