import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Package,
  Clock,
  MapPin,
  Tag,
  HelpCircle,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { Order } from '../types/order';
import { cancelOrderApi } from '../services/orderService';

interface CancelOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CANCEL_REASONS = [
  {
    id: 'better_price',
    label: 'Found a better price elsewhere',
    desc: 'Discovered a cheaper alternative on another store or marketplace',
    icon: Tag,
  },
  {
    id: 'mistake',
    label: 'Ordered by mistake / Changed mind',
    desc: 'No longer need this product or purchased the wrong item',
    icon: RotateCcw,
  },
  {
    id: 'slow_shipping',
    label: 'Estimated delivery is too slow',
    desc: 'Delivery timeframe does not meet my schedule or urgency',
    icon: Clock,
  },
  {
    id: 'address_issue',
    label: 'Incorrect address or contact info',
    desc: 'Need to update shipping destination or recipient phone number',
    icon: MapPin,
  },
  {
    id: 'payment_issue',
    label: 'Need to change payment method',
    desc: 'Want to switch between Credit Card, UPI, or Cash on Delivery',
    icon: CreditCard,
  },
  {
    id: 'other',
    label: 'Other reasons',
    desc: 'Specify a custom reason for cancellation',
    icon: HelpCircle,
  },
];

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedReasonId, setSelectedReasonId] = useState<string>('mistake');
  const [customComment, setCustomComment] = useState<string>('');
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleClose = () => {
    if (submitting) return;
    setStep(1);
    setSelectedReasonId('mistake');
    setCustomComment('');
    setAcknowledged(false);
    setError(null);
    onClose();
  };

  const getFullReasonText = () => {
    const matched = CANCEL_REASONS.find((r) => r.id === selectedReasonId);
    const base = matched ? matched.label : 'Order cancelled by customer';
    if (selectedReasonId === 'other' && customComment.trim()) {
      return `Other: ${customComment.trim()}`;
    }
    if (customComment.trim()) {
      return `${base} - Note: ${customComment.trim()}`;
    }
    return base;
  };

  const handleProceedToReview = () => {
    if (!selectedReasonId) {
      setError('Please select a cancellation reason to continue');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleConfirmCancellation = async () => {
    if (!acknowledged) {
      setError('Please confirm the cancellation acknowledgement checkbox');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const fullReason = getFullReasonText();
      const res = await cancelOrderApi(order._id, fullReason);
      if (res.success) {
        setStep(3);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1800);
      } else {
        throw new Error(res.message || 'Failed to cancel order');
      }
    } catch (err: any) {
      setError(err.message || 'Cancellation could not be processed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isPaid = order.paymentInfo?.status === 'paid';
  const refundAmount = order.pricing?.totalPrice || 0;
  const paymentMethodLabel =
    order.paymentInfo?.method === 'cod'
      ? 'Cash on Delivery'
      : order.paymentInfo?.method === 'upi'
      ? 'UPI Payment'
      : order.paymentInfo?.method === 'card_upi' || order.paymentInfo?.method === 'card'
      ? 'Credit / Debit Card'
      : order.paymentInfo?.method?.toUpperCase() || 'Original Method';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-zinc-950">
                Cancel Order {order.orderNumber}
              </h2>
              <span className="text-[11px] font-semibold text-zinc-400">
                Step {step} of 2 • Multi-step verification
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-2 bg-zinc-100/70 p-1 text-[11px] font-bold text-center gap-1">
          <div
            className={`py-1.5 rounded-lg transition-all ${
              step === 1
                ? 'bg-white text-zinc-950 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            1. Select Reason
          </div>
          <div
            className={`py-1.5 rounded-lg transition-all ${
              step >= 2
                ? 'bg-white text-zinc-950 shadow-2xs'
                : 'text-zinc-400'
            }`}
          >
            2. Review & Refund
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Reason Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-900">
                  Why would you like to cancel this order?
                </p>
                <p className="text-[11px] text-zinc-500">
                  Please let us know the reason so we can improve your shopping experience.
                </p>
              </div>

              <div className="space-y-2">
                {CANCEL_REASONS.map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedReasonId === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        setSelectedReasonId(r.id);
                        setError(null);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-zinc-950 bg-zinc-50 ring-2 ring-zinc-950/5 shadow-2xs'
                          : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-zinc-950 text-white'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900">{r.label}</p>
                          <p className="text-[10px] text-zinc-500">{r.desc}</p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="cancelReasonRadio"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedReasonId(r.id);
                          setError(null);
                        }}
                        className="w-4 h-4 text-zinc-950 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Optional comments box */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-bold text-zinc-700">
                  Additional Details or Feedback (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customComment}
                  onChange={(e) => setCustomComment(e.target.value)}
                  placeholder="Tell us more about why you are cancelling..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Review Impact & Refund Details */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Order summary pill */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 text-xs">
                  <span className="font-semibold text-zinc-500">Order Number:</span>
                  <span className="font-mono font-bold text-zinc-950">{order.orderNumber}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 text-xs">
                  <span className="font-semibold text-zinc-500">Items Count:</span>
                  <span className="font-bold text-zinc-900">
                    {order.orderItems.reduce((acc, item) => acc + item.quantity, 0)} items ({order.orderItems.length} products)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-500">Total Order Value:</span>
                  <span className="text-sm font-black text-zinc-950">
                    ${order.pricing.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Refund Info Box */}
              {isPaid ? (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Automatic Refund Guaranteed</span>
                  </div>
                  <p className="text-xs leading-relaxed text-emerald-900">
                    A full refund of <strong>${refundAmount.toFixed(2)}</strong> will be credited back to your <strong>{paymentMethodLabel}</strong>.
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Processing Timeline: Typically reflects within <strong>3 to 5 business days</strong>.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>No Payment Collected ({paymentMethodLabel})</span>
                  </div>
                  <p className="text-xs leading-relaxed text-blue-900">
                    Because this order was placed under <strong>{paymentMethodLabel}</strong>, no charges were processed. Your order will be halted immediately with zero fees.
                  </p>
                </div>
              )}

              {/* Reason Confirmation */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs">
                <span className="text-zinc-500 font-medium">Selected Reason: </span>
                <span className="font-semibold text-zinc-800">{getFullReasonText()}</span>
              </div>

              {/* User Acknowledgement Checkbox */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-zinc-200 hover:border-zinc-300 bg-white cursor-pointer transition-colors select-none">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => {
                    setAcknowledged(e.target.checked);
                    if (e.target.checked) setError(null);
                  }}
                  className="w-4 h-4 mt-0.5 text-rose-600 rounded border-zinc-300 focus:ring-rose-500 cursor-pointer"
                />
                <span className="text-xs text-zinc-700 leading-snug">
                  I understand that this action is irreversible and this order will be permanently marked as <strong>Cancelled</strong>.
                </span>
              </label>
            </div>
          )}

          {/* STEP 3: Successful Cancellation Animation */}
          {step === 3 && (
            <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-zinc-950">
                  Order Successfully Cancelled
                </h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Your cancellation request has been confirmed. The order status is now updated.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Buttons Footer */}
        {step !== 3 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  onClick={handleProceedToReview}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                >
                  <span>Continue to Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setError(null);
                    setStep(1);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={submitting || !acknowledged}
                  onClick={handleConfirmCancellation}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                >
                  {submitting ? (
                    <span>Processing Cancellation...</span>
                  ) : (
                    <span>Confirm & Cancel Order</span>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
