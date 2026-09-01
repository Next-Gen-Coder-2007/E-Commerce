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
} from 'lucide-react';
import { useCart } from '../context/CartContext';

const FREE_SHIPPING_THRESHOLD = 100;

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    totalItems,
    subtotal,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    actionLoading,
  } = useCart();

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
      setPromoError('Invalid coupon. Try "NOVA10" for 10% off.');
      setDiscountApplied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-zinc-200 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-zinc-950 tracking-tight">
                    Shopping Cart
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-200 text-zinc-800">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">
                  Review & modify your selected products
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeCart}
              className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              title="Close Cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Meter */}
          {items.length > 0 && (
            <div className="px-6 py-3.5 bg-zinc-50 border-b border-zinc-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-zinc-800">
                  <Truck className="w-3.5 h-3.5 text-indigo-600" />
                  {amountForFreeShipping === 0 ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                      Free Express Shipping Unlocked!
                    </span>
                  ) : (
                    <span>
                      Add <span className="font-bold text-zinc-950">${amountForFreeShipping.toFixed(2)}</span> more for Free Shipping
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  {freeShippingProgress}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    amountForFreeShipping === 0
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-indigo-500 to-amber-500'
                  }`}
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Item List / Empty State */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-zinc-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <h3 className="text-sm font-extrabold text-zinc-900">
                    Your cart is currently empty
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Discover featured collections and exclusive daily deals in our catalog.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCart}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 transition-all active:scale-95 shadow-md cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start Shopping</span>
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="py-4 flex gap-4 items-center group transition-all"
                >
                  <div className="w-18 h-18 rounded-xl bg-zinc-100 overflow-hidden border border-zinc-200/80 shrink-0 relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-zinc-900 truncate leading-tight">
                        {item.title}
                      </h4>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => removeFromCart(item.productId)}
                        className="text-zinc-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      {item.companyName && (
                        <span className="truncate max-w-[120px] font-medium text-zinc-600">
                          {item.companyName}
                        </span>
                      )}
                      {item.category && (
                        <span className="px-1.5 py-0.2 bg-zinc-100 text-zinc-600 rounded text-[10px] uppercase font-bold">
                          {item.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-xs font-extrabold text-zinc-950">
                        ${(item.price * item.quantity).toFixed(2)}
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-zinc-400 font-normal ml-1">
                            (${item.price.toFixed(2)} ea)
                          </span>
                        )}
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-zinc-200 rounded-lg bg-zinc-50/80 overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          disabled={actionLoading || item.quantity <= 1}
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-zinc-900 min-w-[20px] text-center font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={actionLoading || (item.stock !== undefined && item.quantity >= item.stock)}
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                          title="Increase quantity"
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
            <div className="border-t border-zinc-200 bg-white px-6 py-5 space-y-4">
              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Promo code (e.g. NOVA10)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 uppercase font-mono placeholder:normal-case placeholder:font-sans focus:outline-none focus:bg-white focus:border-zinc-900"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-800 text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    Apply
                  </button>
                </div>
                {discountApplied && (
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    10% NOVA10 discount applied!
                  </p>
                )}
                {promoError && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    {promoError}
                  </p>
                )}
              </form>

              {/* Order Calculations */}
              <div className="space-y-1.5 text-xs text-zinc-600 pt-1">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-zinc-900 font-mono">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                {discountApplied && (
                  <div className="flex items-center justify-between text-emerald-600 font-medium">
                    <span>Discount (10%)</span>
                    <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-semibold text-zinc-900 font-mono">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 uppercase text-[10px] font-bold">Free</span>
                    ) : (
                      `$${shippingFee.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Estimated Sales Tax (8%)</span>
                  <span className="font-semibold text-zinc-900 font-mono">
                    ${estimatedTax.toFixed(2)}
                  </span>
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-sm font-extrabold text-zinc-950">
                  <span>Estimated Total</span>
                  <span className="text-base font-black font-mono">
                    ${finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Action Button */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    closeCart();
                    navigate('/checkout');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-zinc-950 hover:bg-zinc-800 shadow-md transition-all active:scale-[0.98] cursor-pointer group"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="hover:text-rose-600 transition-colors cursor-pointer underline text-[10px]"
                  >
                    Clear Cart
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Encrypted</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <RotateCcw className="w-3 h-3 text-indigo-600" />
                      <span>30-Day Returns</span>
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
