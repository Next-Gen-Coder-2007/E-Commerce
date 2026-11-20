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
import { BrutalistButton } from './BrutalistButton';

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
    desc: 'Discovered a lower price on another store or website',
    icon: Tag,
  },
  {
    id: 'mistake',
    label: 'Ordered by mistake / Changed mind',
    desc: 'No longer require this item or ordered the incorrect size/color',
    icon: RotateCcw,
  },
  {
    id: 'slow_shipping',
    label: 'Estimated delivery is too late',
    desc: 'Shipping timeline takes longer than required',
    icon: Clock,
  },
  {
    id: 'address_issue',
    label: 'Incorrect shipping address',
    desc: 'Need to change delivery address or phone number',
    icon: MapPin,
  },
  {
    id: 'payment_issue',
    label: 'Change payment method',
    desc: 'Want to switch payment method for this order',
    icon: CreditCard,
  },
  {
    id: 'other',
    label: 'Other reason',
    desc: 'Specify another reason for cancelling this order',
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1E1E]/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#E4E2DD] border-2 border-[#1E1E1E] shadow-[8px_8px_0px_#1E1E1E] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#1E1E1E] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#DB4A2B] flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-clash font-bold text-[#1E1E1E] uppercase tracking-tight">
                CANCEL ORDER // #{order.orderNumber}
              </h2>
              <span className="text-[10px] font-mono text-[#444444] uppercase tracking-wider block">
                STEP {step} OF 2 • ORDER CANCELLATION
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="p-1.5 border border-[#1E1E1E] hover:bg-[#1E1E1E] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-2 border-b-2 border-[#1E1E1E] bg-[#D9D6D0] text-xs font-mono font-bold text-center">
          <div
            className={`py-2 transition-all border-r border-[#1E1E1E] ${
              step === 1
                ? 'bg-[#1E1E1E] text-[#E4E2DD]'
                : 'text-[#444444]'
            }`}
          >
            01. SELECT REASON
          </div>
          <div
            className={`py-2 transition-all ${
              step >= 2
                ? 'bg-[#1E1E1E] text-[#E4E2DD]'
                : 'text-[#444444]'
            }`}
          >
            02. REVIEW & REFUND SUMMARY
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 border-2 border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#1E1E1E] text-xs font-mono flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#DB4A2B] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Reason Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-clash font-bold text-[#1E1E1E] uppercase tracking-wider">
                  REASON FOR CANCELLATION
                </p>
                <p className="text-[11px] font-satoshi text-[#444444]">
                  Please specify why you would like to cancel your order:
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
                      className={`p-3 border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[#1E1E1E] bg-white shadow-[3px_3px_0px_#1E1E1E]'
                          : 'border-zinc-300 hover:border-[#1E1E1E] bg-white/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-[#1E1E1E] bg-[#1E1E1E] text-white'
                              : 'border-zinc-300 bg-[#E4E2DD] text-[#444444]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-clash font-bold text-[#1E1E1E] uppercase">{r.label}</p>
                          <p className="text-[10px] font-satoshi text-[#444444]">{r.desc}</p>
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
                        className="w-4 h-4 accent-[#DB4A2B] cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Optional comments box */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#1E1E1E]">
                  ADDITIONAL COMMENTS (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  value={customComment}
                  onChange={(e) => setCustomComment(e.target.value)}
                  placeholder="Provide any additional comments or reason..."
                  className="w-full px-3 py-2 text-xs font-satoshi border-2 border-[#1E1E1E] bg-white text-[#1E1E1E] focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Review Impact & Refund Details */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Order summary pill */}
              <div className="p-4 border-2 border-[#1E1E1E] bg-white space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200">
                  <span className="text-[#444444] uppercase">ORDER ID:</span>
                  <span className="font-bold text-[#1E1E1E]">{order.orderNumber}</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200">
                  <span className="text-[#444444] uppercase">ITEMS QUANTITY:</span>
                  <span className="font-bold text-[#1E1E1E]">
                    {order.orderItems.reduce((acc, item) => acc + item.quantity, 0)} UNITS ({order.orderItems.length} ITEMS)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#444444] uppercase">TOTAL VALUE:</span>
                  <span className="text-sm font-clash font-bold text-[#DB4A2B]">
                    ${order.pricing.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Refund Info Box */}
              {isPaid ? (
                <div className="p-4 border-2 border-[#1E1E1E] bg-[#D9D6D0] text-[#1E1E1E] space-y-2">
                  <div className="flex items-center gap-2 font-clash font-bold text-xs uppercase text-[#DB4A2B]">
                    <ShieldCheck className="w-4 h-4 text-[#DB4A2B]" />
                    <span>AUTOMATIC REFUND GUARANTEED</span>
                  </div>
                  <p className="text-xs font-satoshi leading-relaxed">
                    A full refund of <strong className="font-mono">${refundAmount.toFixed(2)}</strong> will be credited back via <strong>{paymentMethodLabel}</strong>.
                  </p>
                  <p className="text-[10px] font-mono text-[#444444]">
                    PROCESSING TIMELINE: Typically reflects within 3 to 5 business days.
                  </p>
                </div>
              ) : (
                <div className="p-4 border-2 border-[#1E1E1E] bg-[#D9D6D0] text-[#1E1E1E] space-y-2">
                  <div className="flex items-center gap-2 font-clash font-bold text-xs uppercase text-[#1E1E1E]">
                    <Package className="w-4 h-4" />
                    <span>NO PAYMENT CHARGED ({paymentMethodLabel})</span>
                  </div>
                  <p className="text-xs font-satoshi leading-relaxed">
                    Because this shipment was placed under <strong>{paymentMethodLabel}</strong>, no payment was charged. The order will be cancelled without any fees.
                  </p>
                </div>
              )}

              {/* Reason Confirmation */}
              <div className="p-3 border border-[#1E1E1E] bg-white text-xs font-mono">
                <span className="text-[#444444] uppercase">RECORDED REASON: </span>
                <span className="font-bold text-[#1E1E1E]">{getFullReasonText()}</span>
              </div>

              {/* User Acknowledgement Checkbox */}
              <label className="flex items-start gap-3 p-3 border-2 border-[#1E1E1E] bg-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => {
                    setAcknowledged(e.target.checked);
                    if (e.target.checked) setError(null);
                  }}
                  className="w-4 h-4 mt-0.5 accent-[#DB4A2B] cursor-pointer shrink-0"
                />
                <span className="text-xs font-satoshi text-[#1E1E1E] leading-snug">
                  I understand that this cancellation is final and cannot be reversed.
                </span>
              </label>
            </div>
          )}

          {/* STEP 3: Successful Cancellation Animation */}
          {step === 3 && (
            <div className="py-8 text-center space-y-4 animate-in fade-in">
              <div className="w-14 h-14 border-2 border-[#1E1E1E] bg-[#DB4A2B] text-white flex items-center justify-center mx-auto shadow-[4px_4px_0px_#1E1E1E]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-clash font-bold text-[#1E1E1E] uppercase">
                  ORDER CANCELLED SUCCESSFULLY
                </h3>
                <p className="text-xs font-mono text-[#444444] max-w-xs mx-auto">
                  Your order has been cancelled and inventory released.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Buttons Footer */}
        {step !== 3 && (
          <div className="flex items-center justify-between px-6 py-4 border-t-2 border-[#1E1E1E] bg-white">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-[#444444] hover:text-[#1E1E1E] cursor-pointer"
                >
                  Keep Order
                </button>
                <BrutalistButton
                  onClick={handleProceedToReview}
                  variant="primary"
                >
                  <span>Continue to Review</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </BrutalistButton>
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-[#1E1E1E] bg-white text-xs font-mono font-bold uppercase tracking-wider text-[#1E1E1E] hover:bg-[#D9D6D0] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={submitting || !acknowledged}
                  onClick={handleConfirmCancellation}
                  className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-[#1E1E1E] bg-[#DB4A2B] hover:bg-[#1E1E1E] text-white text-xs font-mono font-bold uppercase tracking-wider disabled:opacity-50 transition-all shadow-[3px_3px_0px_#1E1E1E] cursor-pointer"
                >
                  {submitting ? (
                    <span>CANCELLING ORDER...</span>
                  ) : (
                    <span>CONFIRM & CANCEL ORDER</span>
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

export default CancelOrderModal;
