import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  CheckCircle2,
  Building2,
  LogOut,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { BrutalistButton } from './BrutalistButton';

const FREE_SHIPPING_THRESHOLD = 100;

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    items,
    totalItems,
    subtotal,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    openBusinessModal,
    actionLoading,
  } = useCart();

  const isCompany = user?.role === 'company';

  const [promoCode, setPromoCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [promoError, setPromoError] = useState('');

  if (!isCartOpen) return null;

  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  );
  const amountForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const discountAmount = discountApplied ? subtotal * 0.1 : 0; // 10% OFF
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 9.99;
  const estimatedTax = (subtotal - discountAmount) * 0.08;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee + estimatedTax);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    if (!promoCode.trim()) return;

    if (promoCode.trim().toUpperCase() === 'NOVA10' || promoCode.trim().toUpperCase() === 'SAVE10') {
      setDiscountApplied(true);
      setPromoError('');
    } else {
      setPromoError('INVALID VOUCHER. USE "NOVA10" FOR 10% MARKDOWN.');
      setDiscountApplied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none font-satoshi">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-[#1E1E1E]/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div className="w-screen max-w-md bg-[#E4E2DD] border-l-2 border-[#1E1E1E] shadow-2xl flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] animate-in slide-in-from-right">
          {/* Header */}
          <div className="px-6 py-5 border-b-2 border-[#1E1E1E] flex items-center justify-between bg-[#FFFFFF]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1E1E1E] text-[#E4E2DD] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-clash text-lg font-bold uppercase tracking-tight text-[#1E1E1E]">
                    SHOPPING BAG
                  </h2>
                  <span className="px-2 py-0.5 bg-[#1E1E1E] text-[#E4E2DD] font-mono text-[10px] font-bold">
                    {totalItems} {totalItems === 1 ? 'ITEM' : 'ITEMS'}
                  </span>
                </div>
                <p className="text-[10px] text-[#444444] uppercase tracking-wider font-mono">
                  ARCHIVE REQUISITION MANIFEST
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeCart}
              className="p-2 text-[#1E1E1E] hover:text-[#DB4A2B] hover:bg-[#E4E2DD] transition-colors cursor-pointer"
              title="Close Bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Business Account Detected Banner */}
          {isCompany && (
            <div className="px-6 py-3.5 bg-[#F8A348]/20 border-b-2 border-[#1E1E1E] text-[#1E1E1E] space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#DB4A2B] shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  MERCHANT ACCOUNT ACTIVE ({user?.companyName || user?.name})
                </span>
              </div>
              <p className="text-[11px] text-[#444444] leading-tight">
                Business accounts cannot place consumer retail orders. Please switch to a customer account.
              </p>
            </div>
          )}

          {/* Free Shipping Progress Meter */}
          {items.length > 0 && (
            <div className="px-6 py-3 bg-[#D9D6D0] border-b border-[#1E1E1E]/20 space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5 text-[#1E1E1E]">
                  <Truck className="w-3.5 h-3.5 text-[#DB4A2B]" />
                  {amountForFreeShipping === 0 ? (
                    <span className="text-[#1E1E1E] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                      EXPRESS DELIVERY UNLOCKED
                    </span>
                  ) : (
                    <span>
                      ADD <span className="text-[#DB4A2B] font-bold">${amountForFreeShipping.toFixed(2)}</span> FOR FREE COURIER
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#444444]">
                  {freeShippingProgress}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#FFFFFF] overflow-hidden border border-[#1E1E1E]/30">
                <div
                  className={`h-full transition-all duration-500 ${
                    amountForFreeShipping === 0 ? 'bg-emerald-600' : 'bg-[#1E1E1E]'
                  }`}
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Item List / Empty State */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#1E1E1E]/15">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-[#FFFFFF] border-2 border-[#1E1E1E] flex items-center justify-center text-[#1E1E1E]">
                  <ShoppingBag className="w-8 h-8 text-[#DB4A2B]" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <h3 className="font-clash text-base font-bold uppercase tracking-tight text-[#1E1E1E]">
                    BAG CURRENTLY EMPTY
                  </h3>
                  <p className="text-xs text-[#444444] leading-relaxed">
                    Explore curated seasonal drops and archive collections in the catalog.
                  </p>
                </div>
                <BrutalistButton
                  onClick={closeCart}
                  variant="primary"
                  size="md"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  iconPosition="left"
                >
                  BROWSE ARCHIVE
                </BrutalistButton>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="py-4 flex gap-4 items-center group transition-all"
                >
                  <div className="w-20 h-24 bg-[#FFFFFF] border border-[#1E1E1E]/20 overflow-hidden shrink-0 relative p-1.5 flex items-center justify-center">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-clash text-xs font-bold uppercase text-[#1E1E1E] truncate leading-tight group-hover:text-[#DB4A2B] transition-colors">
                        {item.title}
                      </h4>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => removeFromCart(item.productId)}
                        className="text-[#444444] hover:text-[#DB4A2B] p-1 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#444444] uppercase">
                      {item.companyName && (
                        <span className="truncate max-w-[120px] font-bold">
                          {item.companyName}
                        </span>
                      )}
                      {item.category && (
                        <span className="px-1 bg-[#D9D6D0] text-[#1E1E1E] font-bold">
                          {item.category}
                        </span>
                      )}
                    </div>

                    {item.variantSummary && (
                      <div className="text-[9px] font-mono font-bold uppercase text-[#DB4A2B] bg-[#DB4A2B]/10 px-1.5 py-0.5 inline-block">
                        {item.variantSummary}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1.5">
                      <div className="text-xs font-clash font-bold text-[#1E1E1E]">
                        ${(item.price * item.quantity).toFixed(2)}
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-[#444444] font-mono font-normal ml-1">
                            (${item.price.toFixed(2)} EA)
                          </span>
                        )}
                      </div>

                      {/* Quantity Stepper: Brutalist Rectangular Controls */}
                      <div className="flex items-center border border-[#1E1E1E] bg-[#FFFFFF]">
                        <button
                          type="button"
                          disabled={actionLoading || item.quantity <= 1}
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#1E1E1E] hover:bg-[#1E1E1E] hover:text-[#E4E2DD] disabled:opacity-20 transition-colors cursor-pointer"
                          title="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono font-bold text-[#1E1E1E] min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={actionLoading || (item.stock !== undefined && item.quantity >= item.stock)}
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#1E1E1E] hover:bg-[#1E1E1E] hover:text-[#E4E2DD] disabled:opacity-20 transition-colors cursor-pointer"
                          title="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Order Summary */}
          {items.length > 0 && (
            <div className="border-t-2 border-[#1E1E1E] bg-[#FFFFFF] px-6 py-5 space-y-4">
              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="space-y-1">
                <div className="flex items-center">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#444444]" />
                    <input
                      type="text"
                      placeholder="PROMO CODE (E.G. NOVA10)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-[#1E1E1E]/30 bg-[#E4E2DD]/30 text-xs text-[#1E1E1E] uppercase font-mono placeholder:text-[#444444]/60 focus:outline-none focus:border-[#1E1E1E]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1E1E1E] hover:bg-[#DB4A2B] text-[#E4E2DD] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                  >
                    APPLY
                  </button>
                </div>
                {discountApplied && (
                  <p className="text-[10px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    10% NOVA10 MARKDOWN APPLIED
                  </p>
                )}
                {promoError && (
                  <p className="text-[10px] font-mono text-[#DB4A2B] font-bold">
                    {promoError}
                  </p>
                )}
              </form>

              {/* Order Calculations */}
              <div className="space-y-1 text-xs text-[#444444] pt-1 font-mono uppercase">
                <div className="flex items-center justify-between">
                  <span>SUBTOTAL</span>
                  <span className="font-bold text-[#1E1E1E]">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                {discountApplied && (
                  <div className="flex items-center justify-between text-[#DB4A2B] font-bold">
                    <span>DISCOUNT (10%)</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span>ESTIMATED FREIGHT</span>
                  <span className="font-bold text-[#1E1E1E]">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 font-bold">COMPLIMENTARY</span>
                    ) : (
                      `$${shippingFee.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>ESTIMATED TAX (8%)</span>
                  <span className="font-bold text-[#1E1E1E]">
                    ${estimatedTax.toFixed(2)}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#1E1E1E]/20 flex items-center justify-between text-sm font-clash font-bold text-[#1E1E1E]">
                  <span>TOTAL ESTIMATION</span>
                  <span className="text-base text-[#1E1E1E]">
                    ${finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Action Button */}
              <div className="space-y-2 pt-1">
                {isCompany ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        closeCart();
                        openBusinessModal({ actionTitle: 'Checkout' });
                      }}
                      className="w-full py-3 px-4 text-xs font-bold uppercase tracking-wider text-white bg-[#DB4A2B] hover:bg-[#1E1E1E] transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>SWITCH TO CUSTOMER PROFILE TO ORDER</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          closeCart();
                          await clearCart();
                          await logout();
                          navigate('/login');
                        }}
                        className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-[#1E1E1E] border border-[#1E1E1E] hover:bg-[#1E1E1E] hover:text-[#E4E2DD] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>LOG OUT</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          closeCart();
                          navigate('/business');
                        }}
                        className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-[#E4E2DD] bg-[#1E1E1E] hover:bg-[#DB4A2B] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>MERCHANT HUB</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      closeCart();
                      navigate('/checkout');
                    }}
                    className="w-full raw-btn py-3.5 px-6 text-xs font-bold uppercase tracking-widest text-[#E4E2DD] bg-[#1E1E1E] border border-[#1E1E1E] hover:text-[#DB4A2B] cursor-pointer group flex items-center justify-center gap-2"
                  >
                    <span>PROCEED TO SECURE CHECKOUT</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono text-[#444444] pt-1">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="hover:text-[#DB4A2B] transition-colors cursor-pointer uppercase underline"
                  >
                    CLEAR BAG
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>TLS ENCRYPTED</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <RotateCcw className="w-3 h-3 text-[#1E1E1E]" />
                      <span>30-DAY SAGA REFUND</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
