import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Shield,
  Truck,
  CreditCard,
  Lock,
  ArrowLeft,
  Tag,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Clock,
  ChevronRight,
  Package,
  MapPin,
  Plus,
  BookmarkCheck,
  Trash2,
  QrCode,
  Check,
  Building2,
  LogOut,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrderApi, checkoutWithSagaApi } from '../services/orderService';
import { validateCouponApi, getAvailableCouponsApi } from '../services/couponService';
import { PaymentMethod, ShippingMethodType } from '../types/order';
import { SavedAddress } from '../types/auth';
import type { Coupon } from '../types/coupon';

const AVAILABLE_COUPONS = [
  {
    code: 'NOVA10',
    title: '10% Off Entire Order',
    description: 'Get an extra 10% instant discount across all categories.',
    discountType: 'percent',
    value: 0.1,
  },
  {
    code: 'SPRING20',
    title: '20% Mega Spring Discount',
    description: 'Save 20% on orders with immediate checkout application.',
    discountType: 'percent',
    value: 0.2,
  },
  {
    code: 'FREESHIP',
    title: '100% Free Delivery',
    description: 'Eliminates all standard or expedited courier shipping fees.',
    discountType: 'shipping',
    value: 1.0,
  },
];

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user, logout, addSavedAddress, updateProfile, deleteSavedAddress, setDefaultAddress } = useAuth();

  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string>('new');
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);
  const [addressLabel, setAddressLabel] = useState('Home');

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    deliveryNotes: '',
  });

  const [shippingMethod, setShippingMethod] = useState<ShippingMethodType>('standard');
  // Only 2 payment methods: 'card_upi' (Online Payment) and 'cod' (Cash on Delivery)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card_upi');
  const [onlineSubTab, setOnlineSubTab] = useState<'card' | 'upi'>('card');
  const [upiId, setUpiId] = useState('');
  const [upiVerified, setUpiVerified] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [showCouponDrawer, setShowCouponDrawer] = useState(false);
  const [dynamicCoupons, setDynamicCoupons] = useState<Coupon[]>([]);

  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('•••');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailableOffers = async () => {
      try {
        const res = await getAvailableCouponsApi();
        if (res.success && res.coupons) {
          setDynamicCoupons(res.coupons);
        }
      } catch {
        // Non-blocking
      }
    };
    fetchAvailableOffers();
  }, []);

  // Auto-populate from user's saved addresses
  useEffect(() => {
    if (user) {
      const addresses = user.savedAddresses || [];
      if (addresses.length > 0) {
        const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
        if (defaultAddr && defaultAddr._id) {
          setSelectedSavedAddressId(defaultAddr._id);
          setFormData({
            fullName: defaultAddr.fullName || user.name || '',
            phone: defaultAddr.phone || user.phone || '',
            addressLine1: defaultAddr.addressLine1 || '',
            addressLine2: defaultAddr.addressLine2 || '',
            city: defaultAddr.city || '',
            state: defaultAddr.state || '',
            postalCode: defaultAddr.postalCode || '',
            country: defaultAddr.country || 'United States',
            deliveryNotes: '',
          });
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || user.name || '',
          phone: prev.phone || user.phone || '',
        }));
      }
    }
  }, [user]);

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    if (!addr._id) return;
    setSelectedSavedAddressId(addr._id);
    setFormData({
      fullName: addr.fullName,
      phone: addr.phone || user?.phone || '',
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country || 'United States',
      deliveryNotes: formData.deliveryNotes,
    });
  };

  const handleUseNewAddress = () => {
    setSelectedSavedAddressId('new');
    setFormData({
      fullName: user?.name || '',
      phone: user?.phone || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      deliveryNotes: formData.deliveryNotes,
    });
  };

  const handleDeleteSavedAddress = async (e: React.MouseEvent, addressId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this saved address?')) {
      await deleteSavedAddress(addressId);
      if (selectedSavedAddressId === addressId) {
        handleUseNewAddress();
      }
    }
  };

  const handleSetDefaultAddress = async (e: React.MouseEvent, addressId: string) => {
    e.stopPropagation();
    await setDefaultAddress(addressId);
  };

  // Price calculations
  const rawItemsPrice = subtotal || 0;
  
  let shippingPrice = 0;
  if (shippingMethod === 'express') {
    shippingPrice = 14.99;
  } else if (shippingMethod === 'priority') {
    shippingPrice = 24.99;
  } else if (shippingMethod === 'overnight') {
    shippingPrice = 34.99;
  } else {
    shippingPrice = rawItemsPrice >= 75 ? 0 : 7.99;
  }

  const taxPrice = Number((rawItemsPrice * 0.08).toFixed(2));

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.code === 'FREESHIP') {
      discountAmount = shippingPrice;
    } else {
      discountAmount = appliedCoupon.discount;
    }
  }

  const finalTotal = Math.max(0, rawItemsPrice + (appliedCoupon?.code === 'FREESHIP' ? 0 : shippingPrice) + taxPrice - discountAmount);

  const applySpecificCoupon = async (code: string) => {
    setCouponError(null);
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    setValidatingCoupon(true);
    try {
      const res = await validateCouponApi({
        code: cleanCode,
        cartItems: items.map((item) => ({
          productId: item.productId,
          companyId: item.companyId,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal: rawItemsPrice,
        userId: user?._id,
      });

      if (res.isValid && res.discountAmount > 0) {
        setAppliedCoupon({ code: res.code || cleanCode, discount: res.discountAmount });
        setCouponCode(res.code || cleanCode);
        setCouponError(null);
      } else {
        throw new Error(res.message || 'Invalid coupon code.');
      }
    } catch (err: any) {
      // Fallback for legacy codes
      if (cleanCode === 'NOVA10' || cleanCode === 'WELCOME10') {
        const discount = Number((rawItemsPrice * 0.1).toFixed(2));
        setAppliedCoupon({ code: cleanCode, discount });
        setCouponCode(cleanCode);
      } else if (cleanCode === 'NOVA20' || cleanCode === 'SPRING20') {
        const discount = Number((rawItemsPrice * 0.2).toFixed(2));
        setAppliedCoupon({ code: cleanCode, discount });
        setCouponCode(cleanCode);
      } else if (cleanCode === 'FREESHIP') {
        setAppliedCoupon({ code: cleanCode, discount: shippingPrice });
        setCouponCode(cleanCode);
      } else {
        setCouponError(err.message || 'Invalid or expired coupon promo code.');
      }
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    applySpecificCoupon(couponCode);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [sagaStep, setSagaStep] = useState<number>(0);
  const [sagaMessage, setSagaMessage] = useState<string>('');
  const [sagaFailed, setSagaFailed] = useState<boolean>(false);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (items.length === 0) {
      setError('Your shopping cart is empty.');
      return;
    }

    if (!formData.phone || !formData.phone.trim()) {
      setError('Contact phone number is required for shipping updates and courier dispatch.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (
      !formData.fullName ||
      !formData.addressLine1 ||
      !formData.city ||
      !formData.state ||
      !formData.postalCode
    ) {
      setError('Please complete all required shipping address fields.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSagaFailed(false);
      setSagaStep(1);
      setSagaMessage('Step 1/5: Registering Order & Outbox Event (State: PENDING)...');

      // Save address and phone to user profile if requested
      if (saveAddressToProfile && selectedSavedAddressId === 'new') {
        try {
          await addSavedAddress({
            label: addressLabel || 'Home',
            fullName: formData.fullName,
            phone: formData.phone.trim(),
            addressLine1: formData.addressLine1.trim(),
            addressLine2: formData.addressLine2?.trim() || '',
            city: formData.city.trim(),
            state: formData.state.trim(),
            postalCode: formData.postalCode.trim(),
            country: formData.country || 'United States',
            isDefault: (user.savedAddresses || []).length === 0,
          });
        } catch (addrErr) {
          console.warn('Could not persist address to profile:', addrErr);
        }
      }

      if (!user.phone && formData.phone) {
        try {
          await updateProfile({ phone: formData.phone.trim() });
        } catch (phoneErr) {
          console.warn('Could not persist phone to profile:', phoneErr);
        }
      }

      const orderPayload = {
        orderItems: items.map((item) => ({
          productId: item.productId,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          category: item.category,
          companyId: item.companyId,
          companyName: item.companyName,
        })),
        shippingAddress: {
          fullName: formData.fullName.trim(),
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2?.trim() || '',
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
          country: formData.country || 'United States',
          phone: formData.phone.trim(),
          deliveryNotes: formData.deliveryNotes?.trim() || '',
        },
        shippingMethod,
        paymentMethod,
        couponCode: appliedCoupon?.code,
        notes: formData.deliveryNotes,
      };

      // Step 2: Inventory reservation simulation / transition
      setSagaStep(2);
      setSagaMessage('Step 2/5: Reserving Warehouse Inventory (2-Phase Stock Hold)...');

      // Step 3: Payment authorization
      setSagaStep(3);
      setSagaMessage('Step 3/5: Authorizing Payment with Idempotency Key...');

      const res = await checkoutWithSagaApi(orderPayload).catch(async (_: any) => {
        // Fallback to standard createOrderApi if saga endpoint is unavailable
        return await createOrderApi(orderPayload);
      });

      const confirmedOrder = (res as any)?.data?.order || (res as any)?.order;

      if ((res as any)?.success && confirmedOrder) {
        setSagaStep(4);
        setSagaMessage('Step 4/5: Permanently Committing Inventory Allocation...');
        await new Promise((r) => setTimeout(r, 400));

        setSagaStep(5);
        setSagaMessage('Step 5/5: Order Confirmed & Transactional Outbox Dispatched!');
        await new Promise((r) => setTimeout(r, 600));

        await clearCart();
        navigate(`/orders/${confirmedOrder._id}?success=true`);
      } else {
        setSagaFailed(true);
        setSagaMessage('Saga Compensating Transaction: Inventory hold released, order cancelled.');
        throw new Error((res as any)?.message || 'Checkout saga failed');
      }
    } catch (err: any) {
      setSagaFailed(true);
      setError(err.message || 'An error occurred while executing distributed checkout saga.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setTimeout(() => {
        setSubmitting(false);
        setSagaStep(0);
      }, 1200);
    }
  };

  if (user?.role === 'company') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700 shadow-sm">
          <Building2 className="w-10 h-10" />
        </div>
        <div className="space-y-3">
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold uppercase tracking-wider">
            Business Account Active
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
            Checkout Restricted for Business Accounts
          </h1>
          <p className="text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
            You are currently logged in with your seller account (<strong className="text-zinc-900 font-bold">{user.companyName || user.name}</strong>). Business accounts are configured to sell products and manage merchant inventory, and cannot place customer orders.
          </p>
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 max-w-md mx-auto text-left space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>How to order as a customer:</span>
            </p>
            <p className="text-amber-800 pl-5.5">
              Please log out from this business account and sign in with or register a customer account.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={async () => {
              await clearCart();
              await logout();
              navigate('/login?redirect=/checkout');
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-extrabold text-white bg-zinc-950 hover:bg-zinc-800 transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out & Sign In as Customer</span>
          </button>
          <Link
            to="/business"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-zinc-800 bg-white hover:bg-zinc-100 border border-zinc-200 transition-all shadow-2xs"
          >
            <Building2 className="w-4 h-4" />
            <span>Go to Merchant Dashboard</span>
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <span>Browse Products</span>
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !submitting) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-zinc-950">Your Cart is Empty</h1>
          <p className="text-sm text-zinc-600 max-w-sm mx-auto">
            You don't have any items in your cart yet. Explore our curated store collections to start shopping.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 transition-all shadow-md active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Products</span>
        </Link>
      </div>
    );
  }

  const savedAddresses = user?.savedAddresses || [];

  return (
    <div className="min-h-screen bg-zinc-50/70 pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-200/80 mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <span className="text-zinc-950 font-bold">1. Cart</span>
            <ChevronRight className="w-3 h-3 text-zinc-400" />
            <span className="text-zinc-950 font-bold bg-zinc-950 text-white px-2.5 py-0.5 rounded-full text-[11px]">
              2. Checkout
            </span>
            <ChevronRight className="w-3 h-3 text-zinc-400" />
            <span className="text-zinc-400">3. Confirmation</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Shipping, Delivery & Payment Sections (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Step 1: Shipping Address & Saved Address Book */}
              <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-zinc-950 text-white text-xs font-black flex items-center justify-center">
                      1
                    </span>
                    <h2 className="text-base font-extrabold text-zinc-950">
                      Shipping Address
                    </h2>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    Phone contact mandatory for delivery
                  </span>
                </div>

                {/* Saved Addresses Selector Cards */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                        Saved Address Book ({savedAddresses.length})
                      </span>
                      <Link
                        to="/profile"
                        className="text-[11px] font-semibold text-indigo-600 hover:underline"
                      >
                        Manage in Profile
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedSavedAddressId === addr._id;
                        return (
                          <div
                            key={addr._id}
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all relative group ${
                              isSelected
                                ? 'border-zinc-950 bg-zinc-50/90 shadow-2xs ring-2 ring-zinc-950/5'
                                : 'border-zinc-200 hover:border-zinc-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-1.5">
                              <span className="text-xs font-extrabold text-zinc-950 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-zinc-700" />
                                <span>{addr.label || 'Saved'}</span>
                                {addr.isDefault && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    Default
                                  </span>
                                )}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {addr._id && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteSavedAddress(e, addr._id!)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-600 transition-opacity"
                                    title="Delete address"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                                <input
                                  type="radio"
                                  name="savedAddressRadio"
                                  checked={isSelected}
                                  onChange={() => handleSelectSavedAddress(addr)}
                                  className="w-3.5 h-3.5 text-zinc-950"
                                />
                              </div>
                            </div>
                            <p className="text-xs font-semibold text-zinc-800 truncate">
                              {addr.fullName}
                            </p>
                            <p className="text-[11px] font-mono font-bold text-zinc-600">
                              Tel: {addr.phone}
                            </p>
                            <p className="text-[11px] text-zinc-500 truncate">
                              {addr.addressLine1}
                              {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                            </p>
                            <p className="text-[11px] text-zinc-500">
                              {addr.city}, {addr.state} {addr.postalCode}
                            </p>
                            {!addr.isDefault && addr._id && (
                              <button
                                type="button"
                                onClick={(e) => handleSetDefaultAddress(e, addr._id!)}
                                className="text-[10px] font-bold text-zinc-500 hover:text-zinc-950 underline mt-1 cursor-pointer"
                              >
                                Set as default
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* Option to use a new address */}
                      <div
                        onClick={handleUseNewAddress}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                          selectedSavedAddressId === 'new'
                            ? 'border-zinc-950 bg-zinc-50/90 shadow-2xs ring-2 ring-zinc-950/5'
                            : 'border-dashed border-zinc-300 hover:border-zinc-400 bg-zinc-50/50'
                        }`}
                      >
                        <Plus className="w-4 h-4 text-zinc-600 mb-1" />
                        <span className="text-xs font-extrabold text-zinc-900">
                          + Enter New Address
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          Specify a new delivery destination
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Address Form Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="e.g. Jane Doe"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Contact Phone *</span>
                      <span className="text-[10px] text-emerald-600 font-semibold lowercase">Required for OTP & Courier</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 000-0000 / 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="addressLine1"
                      required
                      value={formData.addressLine1}
                      onChange={handleInputChange}
                      placeholder="House / Flat #, Building Name, Street"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Apartment, suite, unit (optional)
                    </label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleInputChange}
                      placeholder="Apt 4B, 2nd Floor"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g. San Francisco"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="CA"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                        ZIP / Postal *
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        required
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="94103"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition-all"
                      />
                    </div>
                  </div>

                  {/* Save to Profile Toggle */}
                  {selectedSavedAddressId === 'new' && (
                    <div className="sm:col-span-2 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-3 animate-in fade-in">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveAddressToProfile}
                          onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                          className="w-4 h-4 rounded text-zinc-950 border-zinc-300 focus:ring-zinc-950"
                        />
                        <span className="text-xs font-extrabold text-zinc-950 flex items-center gap-1">
                          <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Save this address & contact phone to my profile
                        </span>
                      </label>

                      {saveAddressToProfile && (
                        <div className="pl-6 flex items-center gap-2">
                          <label className="text-[11px] font-bold text-zinc-500">
                            Address Label:
                          </label>
                          <input
                            type="text"
                            value={addressLabel}
                            onChange={(e) => setAddressLabel(e.target.value)}
                            placeholder="Home, Work, Warehouse"
                            className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 max-w-[150px]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Shipping Method */}
              <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-zinc-950 text-white text-xs font-black flex items-center justify-center">
                      2
                    </span>
                    <h2 className="text-base font-extrabold text-zinc-950">
                      Delivery Speed
                    </h2>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    Tracked Fulfillment
                  </span>
                </div>

                <div className="space-y-2.5">
                  <label
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      shippingMethod === 'standard'
                        ? 'border-zinc-950 bg-zinc-50/90 shadow-2xs'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="standard"
                        checked={shippingMethod === 'standard'}
                        onChange={() => setShippingMethod('standard')}
                        className="w-4 h-4 text-zinc-950 border-zinc-300 focus:ring-zinc-950"
                      />
                      <div>
                        <div className="text-xs font-extrabold text-zinc-950">
                          Standard Ground Delivery
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Estimated 3 - 5 business days
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono">
                      {rawItemsPrice >= 75 ? (
                        <span className="text-emerald-700 uppercase font-black">Free</span>
                      ) : (
                        '$7.99'
                      )}
                    </span>
                  </label>

                  <label
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      shippingMethod === 'express'
                        ? 'border-zinc-950 bg-zinc-50/90 shadow-2xs'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="express"
                        checked={shippingMethod === 'express'}
                        onChange={() => setShippingMethod('express')}
                        className="w-4 h-4 text-zinc-950 border-zinc-300 focus:ring-zinc-950"
                      />
                      <div>
                        <div className="text-xs font-extrabold text-zinc-950 flex items-center gap-1.5">
                          <span>Express Courier</span>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                            Popular
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Estimated 2 business days
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-zinc-900">
                      $14.99
                    </span>
                  </label>

                  <label
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      shippingMethod === 'overnight'
                        ? 'border-zinc-950 bg-zinc-50/90 shadow-2xs'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="overnight"
                        checked={shippingMethod === 'overnight'}
                        onChange={() => setShippingMethod('overnight')}
                        className="w-4 h-4 text-zinc-950 border-zinc-300 focus:ring-zinc-950"
                      />
                      <div>
                        <div className="text-xs font-extrabold text-zinc-950 flex items-center gap-1.5">
                          <span>Next-Day Priority Air</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold">
                            Fastest
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Guaranteed delivery by tomorrow 10:30 AM
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-zinc-900">
                      $34.99
                    </span>
                  </label>
                </div>
              </div>

              {/* Step 3: Payment Method - Strictly 2 Options (Credit/Debit/UPI vs Cash on Delivery) */}
              <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-zinc-950 text-white text-xs font-black flex items-center justify-center">
                      3
                    </span>
                    <h2 className="text-base font-extrabold text-zinc-950">
                      Payment Options
                    </h2>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>256-Bit SSL Encryption</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Method 1: Credit / Debit / UPI (Online Instant Payment) */}
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      paymentMethod === 'card_upi' || paymentMethod === 'card' || paymentMethod === 'upi'
                        ? 'border-zinc-950 bg-zinc-50/90 shadow-2xs'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card_upi"
                          checked={paymentMethod === 'card_upi' || paymentMethod === 'card' || paymentMethod === 'upi'}
                          onChange={() => setPaymentMethod('card_upi')}
                          className="w-4 h-4 text-zinc-950 border-zinc-300 focus:ring-zinc-950"
                        />
                        <div>
                          <div className="text-xs font-extrabold text-zinc-950 flex items-center gap-2">
                            <span>Credit / Debit Card & UPI</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Instant Approval
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            Visa, MasterCard, RuPay, Google Pay, PhonePe, Paytm, BHIM UPI
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-700">
                        <CreditCard className="w-4 h-4" />
                        <QrCode className="w-4 h-4 text-indigo-600" />
                      </div>
                    </label>

                    {(paymentMethod === 'card_upi' || paymentMethod === 'card' || paymentMethod === 'upi') && (
                      <div className="mt-4 pt-4 border-t border-zinc-200/80 space-y-4 animate-in fade-in">
                        {/* Sub-Tabs: Card vs UPI */}
                        <div className="flex items-center gap-2 bg-zinc-200/60 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setOnlineSubTab('card')}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                              onlineSubTab === 'card'
                                ? 'bg-white text-zinc-950 shadow-xs'
                                : 'text-zinc-600 hover:text-zinc-950'
                            }`}
                          >
                            Credit / Debit Card
                          </button>
                          <button
                            type="button"
                            onClick={() => setOnlineSubTab('upi')}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              onlineSubTab === 'upi'
                                ? 'bg-white text-zinc-950 shadow-xs'
                                : 'text-zinc-600 hover:text-zinc-950'
                            }`}
                          >
                            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                            <span>UPI (GPay / PhonePe / Paytm)</span>
                          </button>
                        </div>

                        {onlineSubTab === 'card' ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 space-y-1">
                              <label className="block text-[10px] font-bold text-zinc-600 uppercase">
                                Card Number
                              </label>
                              <input
                                type="text"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                placeholder="4242 •••• •••• 4242"
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-950"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-zinc-600 uppercase">
                                Expiry (MM / YY)
                              </label>
                              <input
                                type="text"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="12 / 28"
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-950"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-zinc-600 uppercase">
                                CVC / CVV
                              </label>
                              <input
                                type="text"
                                value={cardCvc}
                                onChange={(e) => setCardCvc(e.target.value)}
                                placeholder="•••"
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-950"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-zinc-600 uppercase">
                                Virtual Payment Address (UPI ID)
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={upiId}
                                  onChange={(e) => {
                                    setUpiId(e.target.value);
                                    setUpiVerified(false);
                                  }}
                                  placeholder="e.g. yourname@okhdfcbank / mobile@paytm"
                                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-950"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (upiId.includes('@')) {
                                      setUpiVerified(true);
                                    } else {
                                      alert('Please enter a valid UPI ID format (e.g. name@upi)');
                                    }
                                  }}
                                  className="px-3 py-2 rounded-lg bg-zinc-950 text-white text-xs font-bold shrink-0 hover:bg-zinc-800"
                                >
                                  {upiVerified ? 'Verified' : 'Verify'}
                                </button>
                              </div>
                            </div>
                            {upiVerified && (
                              <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                UPI ID Verified. Payment request will trigger upon placing order.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Method 2: Cash on Delivery (COD) */}
                  <label
                    className={`block p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-zinc-950 bg-zinc-50/90 shadow-2xs'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="w-4 h-4 text-zinc-950 border-zinc-300 focus:ring-zinc-950"
                        />
                        <div>
                          <div className="text-xs font-extrabold text-zinc-950">
                            Cash on Delivery (COD)
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            Pay with cash or card upon physical package handover
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded">
                        Pay on delivery
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Coupon Promotion Center (5 Cols) */}
            <div className="lg:col-span-5 sticky top-20 space-y-4">
              <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <h3 className="text-sm font-black text-zinc-950 uppercase tracking-wider">
                    Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
                  </h3>
                  <Link
                    to="/"
                    className="text-xs text-indigo-600 hover:underline font-semibold"
                  >
                    Edit Cart
                  </Link>
                </div>

                {/* Items Mini List */}
                <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 pr-1 space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="pt-2 first:pt-0 flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200/80 shrink-0 overflow-hidden p-1 flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-zinc-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 truncate">
                          {item.title}
                        </h4>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                          <span>Qty: {item.quantity}</span>
                          <span>•</span>
                          <span className="text-zinc-700 font-semibold font-mono">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Coupon Center */}
                <div className="pt-2 border-t border-zinc-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-zinc-900" />
                      <span>Promotions & Coupons</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCouponDrawer(!showCouponDrawer)}
                      className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      {showCouponDrawer ? 'Hide Offers' : 'View Offers'}
                    </button>
                  </div>

                  {/* Input Box */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Promo code (e.g. NOVA10)"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs uppercase font-mono placeholder:normal-case placeholder:font-sans focus:outline-none focus:bg-white focus:border-zinc-900"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer shrink-0"
                    >
                      Apply
                    </button>
                  </div>

                  {appliedCoupon && (
                    <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Code '{appliedCoupon.code}' applied (-${discountAmount.toFixed(2)})
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[10px] text-rose-600 hover:underline font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-[11px] text-rose-600 font-medium">
                      {couponError}
                    </p>
                  )}

                  {/* Expandable Available Coupons List */}
                  {showCouponDrawer && (
                    <div className="space-y-2 pt-2 border-t border-zinc-100 animate-in fade-in max-h-60 overflow-y-auto pr-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Available Coupon Discounts
                      </span>
                      {dynamicCoupons.length > 0 ? (
                        dynamicCoupons.map((cp) => (
                          <div
                            key={cp._id || cp.code}
                            className="p-2.5 rounded-xl border border-zinc-200/80 bg-zinc-50/70 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-xs font-black text-zinc-950 bg-zinc-200 px-1.5 py-0.5 rounded">
                                  {cp.code}
                                </span>
                                <span className="text-xs font-bold text-emerald-800">
                                  {cp.discountType === 'percentage'
                                    ? `${cp.discountValue}% OFF`
                                    : `$${cp.discountValue.toFixed(2)} OFF`}
                                </span>
                                {cp.companyName && (
                                  <span className="text-[9px] text-zinc-500 font-medium">
                                    • {cp.companyName}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-zinc-600 mt-0.5 line-clamp-1">
                                {cp.description}
                              </p>
                              {cp.minPurchaseAmount > 0 && (
                                <p className="text-[9px] text-zinc-400 font-mono">
                                  Min. order: ${cp.minPurchaseAmount.toFixed(2)}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              disabled={validatingCoupon}
                              onClick={() => applySpecificCoupon(cp.code)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-950 text-white text-[10px] font-bold shrink-0 hover:bg-zinc-800 cursor-pointer disabled:opacity-50"
                            >
                              Apply
                            </button>
                          </div>
                        ))
                      ) : (
                        AVAILABLE_COUPONS.map((cp) => (
                          <div
                            key={cp.code}
                            className="p-2.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50 flex items-center justify-between gap-2"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-black text-zinc-950 bg-zinc-200 px-1.5 py-0.5 rounded">
                                  {cp.code}
                                </span>
                                <span className="text-xs font-bold text-zinc-800">
                                  {cp.title}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-0.5">
                                {cp.description}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={validatingCoupon}
                              onClick={() => applySpecificCoupon(cp.code)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-950 text-white text-[10px] font-bold shrink-0 hover:bg-zinc-800 cursor-pointer disabled:opacity-50"
                            >
                              Apply
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Calculations */}
                <div className="pt-2 border-t border-zinc-100 space-y-2 text-xs text-zinc-600">
                  <div className="flex items-center justify-between">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-zinc-900 font-mono">
                      ${rawItemsPrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Shipping & Handling</span>
                    <span className="font-semibold text-zinc-900 font-mono">
                      {shippingPrice === 0 ? (
                        <span className="text-emerald-700 uppercase font-bold text-[10px]">
                          Free
                        </span>
                      ) : (
                        `$${shippingPrice.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Estimated Sales Tax (8%)</span>
                    <span className="font-semibold text-zinc-900 font-mono">
                      ${taxPrice.toFixed(2)}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-700 font-semibold">
                      <span>Promotional Discount</span>
                      <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-sm font-extrabold text-zinc-950">
                    <span>Order Total</span>
                    <span className="text-lg font-black font-mono">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-xs font-black text-white bg-zinc-950 hover:bg-zinc-800 shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Authorizing & Placing Order...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <span>Place Order (${finalTotal.toFixed(2)})</span>
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-2 text-center text-[10px] text-zinc-400 pt-1">
                    <div className="flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>30-Day Guarantee</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Fast Dispatch</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Live Distributed Order Progress Visualizer Modal */}
      {(submitting || sagaStep > 0) && (
        <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 max-w-lg w-full text-zinc-900 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center mx-auto text-xl">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-zinc-950 tracking-tight">
                Securing Your Order
              </h3>
              <p className="text-xs text-zinc-500">
                Please wait while we confirm your items and process your payment safely.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  sagaFailed ? 'bg-rose-500' : 'bg-zinc-950'
                }`}
                style={{
                  width: sagaFailed ? '100%' : `${Math.min(100, Math.max(10, sagaStep * 20))}%`,
                }}
              />
            </div>

            {/* Step list */}
            <div className="space-y-2.5 text-xs">
              {[
                { step: 1, title: 'Step 1: Staging Order Details', desc: 'Validating items and delivery destination' },
                { step: 2, title: 'Step 2: Reserving Inventory', desc: 'Holding items from merchant warehouse' },
                { step: 3, title: 'Step 3: Processing Payment', desc: 'Authorizing secure transaction' },
                { step: 4, title: 'Step 4: Allocating Stock', desc: 'Confirming warehouse fulfillment slot' },
                { step: 5, title: 'Step 5: Order Confirmed', desc: 'Generating confirmation and dispatching tracking' },
              ].map((s) => {
                const isCompleted = sagaStep > s.step;
                const isCurrent = sagaStep === s.step;
                return (
                  <div
                    key={s.step}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                      isCompleted
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : isCurrent
                        ? 'bg-zinc-50 border-zinc-900 text-zinc-950 shadow-xs ring-1 ring-zinc-900'
                        : 'bg-zinc-50/50 border-zinc-200/60 text-zinc-400'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{s.title}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500">{s.desc}</div>
                    </div>
                    <div className="shrink-0 ml-3">
                      {isCompleted ? (
                        <span className="text-emerald-700 font-bold text-xs">Done</span>
                      ) : isCurrent ? (
                        <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="text-zinc-400 text-xs">Pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Footer */}
            <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-center font-mono text-xs text-zinc-700">
              {sagaMessage || 'Coordinating distributed transactions...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
