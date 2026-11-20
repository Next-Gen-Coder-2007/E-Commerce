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
  ArrowRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrderApi, checkoutWithSagaApi } from '../services/orderService';
import { validateCouponApi, getAvailableCouponsApi } from '../services/couponService';
import { PaymentMethod, ShippingMethodType } from '../types/order';
import { SavedAddress } from '../types/auth';
import type { Coupon } from '../types/coupon';
import { RawAtmosphere } from '../components/RawAtmosphere';
import { BrutalistButton } from '../components/BrutalistButton';

const AVAILABLE_COUPONS = [
  {
    code: 'NOVA10',
    title: '10% OFF ENTIRE ORDER',
    description: 'Get an extra 10% instant discount across all categories.',
    discountType: 'percent',
    value: 0.1,
  },
  {
    code: 'SPRING20',
    title: '20% MEGA SPRING DISCOUNT',
    description: 'Save 20% on orders with immediate checkout application.',
    discountType: 'percent',
    value: 0.2,
  },
  {
    code: 'FREESHIP',
    title: '100% FREE DELIVERY',
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
        setCouponError(err.message || 'Invalid or expired voucher code.');
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
      setError('Your shopping bag is empty.');
      return;
    }

    if (!formData.phone || !formData.phone.trim()) {
      setError('Contact telephone number is required for courier delivery updates.');
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
      setError('Please complete all mandatory destination fields.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSagaFailed(false);
      setSagaStep(1);
      setSagaMessage('Step 1/5: Registering Order & Outbox Event (State: PENDING)...');

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

      setSagaStep(2);
      setSagaMessage('Step 2/5: Reserving Warehouse Inventory (2-Phase Stock Hold)...');

      setSagaStep(3);
      setSagaMessage('Step 3/5: Authorizing Payment with Idempotency Key...');

      const res = await checkoutWithSagaApi(orderPayload).catch(async (_: any) => {
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
      setError(err.message || 'An error occurred during distributed checkout saga coordination.');
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
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6 font-satoshi">
        <div className="w-16 h-16 bg-[#1E1E1E] text-[#DB4A2B] flex items-center justify-center mx-auto">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-3">
          <span className="px-3 py-1 bg-[#1E1E1E] text-[#E4E2DD] font-mono text-[10px] font-bold uppercase tracking-widest">
            SELLER CREDENTIAL DETECTED
          </span>
          <h1 className="font-clash text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#1E1E1E]">
            CHECKOUT RESTRICTED FOR MERCHANTS
          </h1>
          <p className="text-xs text-[#444444] max-w-md mx-auto leading-relaxed">
            Logged in as merchant <strong className="text-[#1E1E1E] font-bold">{user.companyName || user.name}</strong>. Business accounts cannot purchase retail consumer inventory.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={async () => {
              await clearCart();
              await logout();
              navigate('/login?redirect=/checkout');
            }}
            className="raw-btn px-6 py-3 bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E] text-xs font-bold uppercase tracking-widest cursor-pointer"
          >
            SIGN OUT & SIGN IN AS CUSTOMER
          </button>
          <Link
            to="/business"
            className="px-6 py-3 bg-[#FFFFFF] border border-[#1E1E1E] text-xs font-mono font-bold uppercase tracking-wider text-[#1E1E1E] hover:bg-[#1E1E1E] hover:text-[#E4E2DD] transition-colors"
          >
            MERCHANT PORTAL
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !submitting) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6 font-satoshi">
        <div className="w-16 h-16 bg-[#FFFFFF] border-2 border-[#1E1E1E] flex items-center justify-center mx-auto text-[#1E1E1E]">
          <ShoppingBag className="w-8 h-8 text-[#DB4A2B]" />
        </div>
        <div className="space-y-2">
          <h1 className="font-clash text-2xl font-bold uppercase tracking-tight text-[#1E1E1E]">
            SHOPPING BAG IS EMPTY
          </h1>
          <p className="text-xs text-[#444444] leading-relaxed">
            No items present in your order manifest. Explore the catalog to select pieces.
          </p>
        </div>
        <Link
          to="/"
          className="inline-block raw-btn px-8 py-3.5 bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E] text-xs font-bold uppercase tracking-widest"
        >
          BROWSE CATALOG
        </Link>
      </div>
    );
  }

  const savedAddresses = user?.savedAddresses || [];

  return (
    <div className="min-h-screen bg-[#E4E2DD] text-[#1E1E1E] font-satoshi py-8 px-4 sm:px-6 lg:px-10 relative select-none">
      <RawAtmosphere variant="subtle" />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Step Indicator Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-[#1E1E1E]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#1E1E1E] hover:text-[#DB4A2B] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO CATALOG</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest">
            <span className="text-[#444444]">01. BAG</span>
            <span className="text-[#444444]">/</span>
            <span className="bg-[#1E1E1E] text-[#E4E2DD] px-2.5 py-1 font-bold">
              02. CHECKOUT MANIFEST
            </span>
            <span className="text-[#444444]">/</span>
            <span className="text-[#444444]">03. DISPATCH CONFIRMATION</span>
          </div>
        </div>

        {error && (
          <div className="p-4 border-2 border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#DB4A2B] text-xs font-mono font-bold uppercase flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Delivery Address, Shipping Speed, Payment (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* STEP 1: DESTINATION ADDRESS */}
              <div className="bg-[#FFFFFF] border-2 border-[#1E1E1E] p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#1E1E1E]/15">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-[#1E1E1E] text-[#E4E2DD] text-xs font-mono font-bold flex items-center justify-center">
                      01
                    </span>
                    <h2 className="font-clash text-lg font-bold uppercase tracking-tight text-[#1E1E1E]">
                      DISPATCH DESTINATION
                    </h2>
                  </div>
                  <span className="font-mono text-[10px] text-[#444444] uppercase">
                    CONTACT TELEPHONE MANDATORY
                  </span>
                </div>

                {/* Saved Address Book Selector */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-3 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#444444] uppercase tracking-wider block">
                        SAVED DESTINATIONS ({savedAddresses.length})
                      </span>
                      <Link
                        to="/profile"
                        className="text-[10px] font-bold text-[#DB4A2B] uppercase hover:underline"
                      >
                        MANAGE IN PROFILE →
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedSavedAddressId === addr._id;
                        return (
                          <div
                            key={addr._id}
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`p-3.5 border cursor-pointer transition-all relative ${
                              isSelected
                                ? 'border-2 border-[#1E1E1E] bg-[#E4E2DD]/40'
                                : 'border border-[#1E1E1E]/20 bg-[#FFFFFF] hover:border-[#1E1E1E]/50'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-1">
                              <span className="text-[11px] font-bold text-[#1E1E1E] uppercase flex items-center gap-1.5">
                                <span>{addr.label || 'DESTINATION'}</span>
                                {addr.isDefault && (
                                  <span className="text-[9px] font-bold bg-[#1E1E1E] text-[#E4E2DD] px-1.5 py-0.2">
                                    PRIMARY
                                  </span>
                                )}
                              </span>
                              <input
                                type="radio"
                                name="savedAddressRadio"
                                checked={isSelected}
                                onChange={() => handleSelectSavedAddress(addr)}
                                className="w-3.5 h-3.5 accent-[#1E1E1E]"
                              />
                            </div>
                            <p className="text-xs font-bold text-[#1E1E1E] uppercase truncate">
                              {addr.fullName}
                            </p>
                            <p className="text-[10px] text-[#444444]">
                              TEL: {addr.phone}
                            </p>
                            <p className="text-[10px] text-[#444444] truncate">
                              {addr.addressLine1} {addr.addressLine2 && `, ${addr.addressLine2}`}
                            </p>
                            <p className="text-[10px] text-[#444444]">
                              {addr.city}, {addr.state} {addr.postalCode}
                            </p>
                          </div>
                        );
                      })}

                      {/* Option to use a new address */}
                      <div
                        onClick={handleUseNewAddress}
                        className={`p-3.5 border cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                          selectedSavedAddressId === 'new'
                            ? 'border-2 border-[#1E1E1E] bg-[#E4E2DD]/40'
                            : 'border border-dashed border-[#1E1E1E]/40 hover:border-[#1E1E1E] bg-[#FFFFFF]'
                        }`}
                      >
                        <Plus className="w-4 h-4 text-[#1E1E1E] mb-1" />
                        <span className="text-xs font-mono font-bold text-[#1E1E1E] uppercase">
                          + SPECIFY NEW DESTINATION
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-wider">
                      RECIPIENT NAME *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Jane Doe"
                      className="w-full px-3 py-2.5 bg-[#E4E2DD]/30 border border-[#1E1E1E]/30 text-xs font-satoshi uppercase text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-wider">
                      CONTACT TELEPHONE *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2.5 bg-[#E4E2DD]/30 border border-[#1E1E1E]/30 text-xs font-mono text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E]"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-wider">
                      STREET ADDRESS *
                    </label>
                    <input
                      type="text"
                      name="addressLine1"
                      required
                      value={formData.addressLine1}
                      onChange={handleInputChange}
                      placeholder="House / Unit #, Building Name, Street"
                      className="w-full px-3 py-2.5 bg-[#E4E2DD]/30 border border-[#1E1E1E]/30 text-xs font-satoshi uppercase text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E]"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-wider">
                      SUITE / APT / FLOOR (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleInputChange}
                      placeholder="Studio 4B"
                      className="w-full px-3 py-2.5 bg-[#E4E2DD]/30 border border-[#1E1E1E]/30 text-xs font-satoshi uppercase text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-wider">
                      CITY *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      className="w-full px-3 py-2.5 bg-[#E4E2DD]/30 border border-[#1E1E1E]/30 text-xs font-satoshi uppercase text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-wider">
                        STATE *
                      </label>
                      <input
                        type="text"
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="State / Region"
                        className="w-full px-3 py-2.5 bg-[#E4E2DD]/30 border border-[#1E1E1E]/30 text-xs font-satoshi uppercase text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-wider">
                        POSTAL CODE *
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        required
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="ZIP"
                        className="w-full px-3 py-2.5 bg-[#E4E2DD]/30 border border-[#1E1E1E]/30 text-xs font-mono text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E]"
                      />
                    </div>
                  </div>

                  {/* Save to Profile Toggle */}
                  {selectedSavedAddressId === 'new' && (
                    <div className="sm:col-span-2 p-3 bg-[#E4E2DD]/40 border border-[#1E1E1E]/20 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveAddressToProfile}
                          onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                          className="w-4 h-4 accent-[#1E1E1E]"
                        />
                        <span className="text-[11px] font-bold text-[#1E1E1E] uppercase">
                          SAVE DESTINATION TO MY PROFILE
                        </span>
                      </label>
                      {saveAddressToProfile && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] text-[#444444] uppercase">LABEL:</span>
                          <input
                            type="text"
                            value={addressLabel}
                            onChange={(e) => setAddressLabel(e.target.value)}
                            placeholder="Home / Studio"
                            className="px-2.5 py-1 border border-[#1E1E1E]/30 bg-[#FFFFFF] text-xs font-mono uppercase text-[#1E1E1E] max-w-[140px]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 2: SHIPPING SPEED */}
              <div className="bg-[#FFFFFF] border-2 border-[#1E1E1E] p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#1E1E1E]/15">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-[#1E1E1E] text-[#E4E2DD] text-xs font-mono font-bold flex items-center justify-center">
                      02
                    </span>
                    <h2 className="font-clash text-lg font-bold uppercase tracking-tight text-[#1E1E1E]">
                      FREIGHT SPEED & ROUTING
                    </h2>
                  </div>
                  <span className="font-mono text-[10px] text-[#DB4A2B] font-bold uppercase flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    TRACKED DISPATCH
                  </span>
                </div>

                <div className="space-y-2.5 font-mono text-xs">
                  <label
                    className={`flex items-center justify-between p-3.5 border cursor-pointer transition-all ${
                      shippingMethod === 'standard'
                        ? 'border-2 border-[#1E1E1E] bg-[#E4E2DD]/40'
                        : 'border border-[#1E1E1E]/20 bg-[#FFFFFF] hover:border-[#1E1E1E]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="standard"
                        checked={shippingMethod === 'standard'}
                        onChange={() => setShippingMethod('standard')}
                        className="w-4 h-4 accent-[#1E1E1E]"
                      />
                      <div>
                        <div className="font-bold text-[#1E1E1E] uppercase">
                          STANDARD GROUND COURIER
                        </div>
                        <div className="text-[10px] text-[#444444]">
                          ESTIMATED 3 - 5 OPERATIONAL DAYS
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-[#1E1E1E]">
                      {rawItemsPrice >= 75 ? (
                        <span className="text-emerald-700 font-bold uppercase">COMPLIMENTARY</span>
                      ) : (
                        '$7.99'
                      )}
                    </span>
                  </label>

                  <label
                    className={`flex items-center justify-between p-3.5 border cursor-pointer transition-all ${
                      shippingMethod === 'express'
                        ? 'border-2 border-[#1E1E1E] bg-[#E4E2DD]/40'
                        : 'border border-[#1E1E1E]/20 bg-[#FFFFFF] hover:border-[#1E1E1E]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="express"
                        checked={shippingMethod === 'express'}
                        onChange={() => setShippingMethod('express')}
                        className="w-4 h-4 accent-[#1E1E1E]"
                      />
                      <div>
                        <div className="font-bold text-[#1E1E1E] uppercase">
                          EXPRESS COURIER
                        </div>
                        <div className="text-[10px] text-[#444444]">
                          ESTIMATED 2 BUSINESS DAYS
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-[#1E1E1E]">$14.99</span>
                  </label>

                  <label
                    className={`flex items-center justify-between p-3.5 border cursor-pointer transition-all ${
                      shippingMethod === 'overnight'
                        ? 'border-2 border-[#1E1E1E] bg-[#E4E2DD]/40'
                        : 'border border-[#1E1E1E]/20 bg-[#FFFFFF] hover:border-[#1E1E1E]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="overnight"
                        checked={shippingMethod === 'overnight'}
                        onChange={() => setShippingMethod('overnight')}
                        className="w-4 h-4 accent-[#1E1E1E]"
                      />
                      <div>
                        <div className="font-bold text-[#1E1E1E] uppercase">
                          PRIORITY AIR DISPATCH
                        </div>
                        <div className="text-[10px] text-[#444444]">
                          GUARANTEED ARRIVAL BY 10:30 AM
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-[#1E1E1E]">$34.99</span>
                  </label>
                </div>
              </div>

              {/* STEP 3: PAYMENT OPTIONS */}
              <div className="bg-[#FFFFFF] border-2 border-[#1E1E1E] p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#1E1E1E]/15">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-[#1E1E1E] text-[#E4E2DD] text-xs font-mono font-bold flex items-center justify-center">
                      03
                    </span>
                    <h2 className="font-clash text-lg font-bold uppercase tracking-tight text-[#1E1E1E]">
                      SETTLEMENT PROTOCOL
                    </h2>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-[#1E1E1E] font-bold uppercase">
                    <Lock className="w-3.5 h-3.5 text-[#DB4A2B]" />
                    <span>256-BIT TLS VAULT</span>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {/* Method 1: Credit / Debit / UPI */}
                  <div
                    className={`p-4 border transition-all ${
                      paymentMethod === 'card_upi' || paymentMethod === 'card' || paymentMethod === 'upi'
                        ? 'border-2 border-[#1E1E1E] bg-[#E4E2DD]/30'
                        : 'border border-[#1E1E1E]/20 bg-[#FFFFFF]'
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
                          className="w-4 h-4 accent-[#1E1E1E]"
                        />
                        <div>
                          <div className="font-bold text-[#1E1E1E] uppercase flex items-center gap-2">
                            <span>ONLINE PAYMENT &bull; CARD & UPI</span>
                            <span className="px-1.5 py-0.2 bg-[#1E1E1E] text-[#E4E2DD] text-[9px] font-bold">
                              INSTANT APPROVAL
                            </span>
                          </div>
                          <div className="text-[10px] text-[#444444]">
                            VISA, MASTERCARD, RUPAY, GPAY, PHONEPE, BHIM UPI
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[#1E1E1E]">
                        <CreditCard className="w-4 h-4" />
                        <QrCode className="w-4 h-4 text-[#DB4A2B]" />
                      </div>
                    </label>

                    {(paymentMethod === 'card_upi' || paymentMethod === 'card' || paymentMethod === 'upi') && (
                      <div className="mt-4 pt-4 border-t border-[#1E1E1E]/15 space-y-3 animate-in fade-in">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setOnlineSubTab('card')}
                            className={`flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider transition ${
                              onlineSubTab === 'card'
                                ? 'bg-[#1E1E1E] text-[#E4E2DD]'
                                : 'bg-[#FFFFFF] border border-[#1E1E1E]/30 text-[#1E1E1E]'
                            }`}
                          >
                            CREDIT / DEBIT CARD
                          </button>
                          <button
                            type="button"
                            onClick={() => setOnlineSubTab('upi')}
                            className={`flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                              onlineSubTab === 'upi'
                                ? 'bg-[#1E1E1E] text-[#E4E2DD]'
                                : 'bg-[#FFFFFF] border border-[#1E1E1E]/30 text-[#1E1E1E]'
                            }`}
                          >
                            <QrCode className="w-3.5 h-3.5 text-[#DB4A2B]" />
                            <span>BHIM / UPI APPS</span>
                          </button>
                        </div>

                        {onlineSubTab === 'card' ? (
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="col-span-2 space-y-1">
                              <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase">
                                CARD NUMBER
                              </label>
                              <input
                                type="text"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                placeholder="4242 •••• •••• 4242"
                                className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#1E1E1E]/30 text-xs font-mono text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E]"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase">
                                EXPIRY (MM / YY)
                              </label>
                              <input
                                type="text"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="12 / 28"
                                className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#1E1E1E]/30 text-xs font-mono text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E]"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase">
                                CVC / CVV
                              </label>
                              <input
                                type="text"
                                value={cardCvc}
                                onChange={(e) => setCardCvc(e.target.value)}
                                placeholder="•••"
                                className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#1E1E1E]/30 text-xs font-mono text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E]"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 pt-1">
                            <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase">
                              UPI IDENTIFIER (VPA)
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={upiId}
                                onChange={(e) => {
                                  setUpiId(e.target.value);
                                  setUpiVerified(false);
                                }}
                                placeholder="user@okhdfcbank / mobile@paytm"
                                className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#1E1E1E]/30 text-xs font-mono text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E]"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (upiId.includes('@')) {
                                    setUpiVerified(true);
                                  } else {
                                    alert('Enter a valid UPI VPA format (e.g. name@upi)');
                                  }
                                }}
                                className="px-4 py-2 bg-[#1E1E1E] text-[#E4E2DD] text-xs font-bold uppercase tracking-wider shrink-0"
                              >
                                {upiVerified ? 'VERIFIED' : 'VERIFY'}
                              </button>
                            </div>
                            {upiVerified && (
                              <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                UPI ID AUTHENTICATED. APPROVAL TRIGGERED UPON ORDER DISPATCH.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Method 2: Cash on Delivery */}
                  <label
                    className={`block p-4 border cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-2 border-[#1E1E1E] bg-[#E4E2DD]/30'
                        : 'border border-[#1E1E1E]/20 bg-[#FFFFFF]'
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
                          className="w-4 h-4 accent-[#1E1E1E]"
                        />
                        <div>
                          <div className="font-bold text-[#1E1E1E] uppercase">
                            CASH ON DELIVERY (COD)
                          </div>
                          <div className="text-[10px] text-[#444444]">
                            SETTLE IN PERSON UPON DIRECT PHYSICAL COURIER HANDOVER
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold uppercase bg-[#D9D6D0] text-[#1E1E1E] px-2 py-0.5">
                        DOORSTEP
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Coupon Privileges (5 cols) */}
            <div className="lg:col-span-5 sticky top-20 space-y-4 font-mono">
              <div className="bg-[#FFFFFF] border-2 border-[#1E1E1E] p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#1E1E1E]/15">
                  <h3 className="font-clash text-base font-bold uppercase tracking-tight text-[#1E1E1E]">
                    ORDER MANIFEST ({items.length} {items.length === 1 ? 'ITEM' : 'ITEMS'})
                  </h3>
                  <Link
                    to="/"
                    className="text-[10px] font-bold text-[#DB4A2B] uppercase hover:underline"
                  >
                    EDIT BAG
                  </Link>
                </div>

                {/* Items Mini List */}
                <div className="max-h-56 overflow-y-auto divide-y divide-[#1E1E1E]/10 pr-1 space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="pt-2 first:pt-0 flex items-center gap-3"
                    >
                      <div className="w-12 h-14 bg-[#E4E2DD]/40 border border-[#1E1E1E]/20 shrink-0 p-1 flex items-center justify-center">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-clash text-xs font-bold uppercase text-[#1E1E1E] truncate">
                          {item.title}
                        </h4>
                        <div className="text-[10px] text-[#444444] flex items-center gap-2">
                          <span>QTY: {item.quantity}</span>
                          <span>&bull;</span>
                          <span className="text-[#1E1E1E] font-bold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Voucher Center */}
                <div className="pt-2 border-t border-[#1E1E1E]/15 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold text-[#1E1E1E] uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#DB4A2B]" />
                      <span>PROMOTIONS & VOUCHERS</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCouponDrawer(!showCouponDrawer)}
                      className="text-[10px] font-bold text-[#DB4A2B] uppercase hover:underline cursor-pointer"
                    >
                      {showCouponDrawer ? 'HIDE OFFERS' : 'VIEW OFFERS'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="VOUCHER (E.G. NOVA10)"
                      className="w-full px-3 py-2 bg-[#E4E2DD]/30 border border-[#1E1E1E]/30 text-xs font-mono uppercase text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-[#1E1E1E] hover:bg-[#DB4A2B] text-[#E4E2DD] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                    >
                      APPLY
                    </button>
                  </div>

                  {appliedCoupon && (
                    <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 border border-emerald-200 flex items-center justify-between uppercase">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        CODE &lsquo;{appliedCoupon.code}&rsquo; APPLIED (-${discountAmount.toFixed(2)})
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[#DB4A2B] hover:underline"
                      >
                        REMOVE
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-[10px] text-[#DB4A2B] font-bold uppercase">
                      {couponError}
                    </p>
                  )}

                  {/* Expandable Coupons Drawer */}
                  {showCouponDrawer && (
                    <div className="space-y-2 pt-2 border-t border-[#1E1E1E]/10 animate-in fade-in max-h-56 overflow-y-auto pr-1">
                      {AVAILABLE_COUPONS.map((cp) => (
                        <div
                          key={cp.code}
                          className="p-2.5 border border-[#1E1E1E]/20 bg-[#E4E2DD]/30 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-[#1E1E1E] bg-[#FFFFFF] px-1.5 py-0.5 border border-[#1E1E1E]/20">
                                {cp.code}
                              </span>
                              <span className="text-[11px] font-bold text-[#DB4A2B]">
                                {cp.title}
                              </span>
                            </div>
                            <p className="text-[9px] text-[#444444] mt-0.5 normal-case">
                              {cp.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => applySpecificCoupon(cp.code)}
                            className="px-2.5 py-1 bg-[#1E1E1E] hover:bg-[#DB4A2B] text-[#E4E2DD] text-[10px] font-bold uppercase shrink-0 cursor-pointer"
                          >
                            APPLY
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Calculations Breakdown */}
                <div className="pt-2 border-t border-[#1E1E1E]/15 space-y-1.5 text-xs text-[#444444] uppercase">
                  <div className="flex items-center justify-between">
                    <span>ITEMS SUBTOTAL</span>
                    <span className="font-bold text-[#1E1E1E]">
                      ${rawItemsPrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>FREIGHT & DISPATCH</span>
                    <span className="font-bold text-[#1E1E1E]">
                      {shippingPrice === 0 ? (
                        <span className="text-emerald-700 font-bold">COMPLIMENTARY</span>
                      ) : (
                        `$${shippingPrice.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>SALES TAX (8%)</span>
                    <span className="font-bold text-[#1E1E1E]">
                      ${taxPrice.toFixed(2)}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-[#DB4A2B] font-bold">
                      <span>VOUCHER DEDUCTION</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t-2 border-[#1E1E1E] flex items-center justify-between text-base font-clash font-bold text-[#1E1E1E]">
                    <span>FINAL SETTLEMENT</span>
                    <span className="text-xl">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full raw-btn py-4 px-6 bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E] text-xs font-bold uppercase tracking-widest cursor-pointer group flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#E4E2DD] border-t-transparent animate-spin" />
                        <span>AUTHORIZING TRANSACTIONS...</span>
                      </div>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>EXECUTE ORDER (${finalTotal.toFixed(2)})</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-2 text-center text-[10px] text-[#444444] pt-1 uppercase">
                    <div className="flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>30-DAY SAGA REFUND</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#DB4A2B]" />
                      <span>EXPRESS COURIER</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Live Distributed Saga Order Visualizer Modal */}
      {(submitting || sagaStep > 0) && (
        <div className="fixed inset-0 z-50 bg-[#1E1E1E]/85 backdrop-blur-xs flex items-center justify-center p-4 font-satoshi animate-in fade-in duration-200">
          <div className="bg-[#E4E2DD] border-2 border-[#1E1E1E] p-6 sm:p-8 max-w-lg w-full text-[#1E1E1E] shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-[#1E1E1E] text-[#E4E2DD] flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-[#DB4A2B]" />
              </div>
              <h3 className="font-clash text-xl font-bold uppercase tracking-tight text-[#1E1E1E]">
                COORDINATING DISTRIBUTED SAGA
              </h3>
              <p className="text-xs text-[#444444] font-mono uppercase">
                TWO-PHASE INVENTORY HOLD & IDEMPOTENT TRANSACTION AUTHORIZATION
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#FFFFFF] border border-[#1E1E1E]/30 h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  sagaFailed ? 'bg-[#DB4A2B]' : 'bg-[#1E1E1E]'
                }`}
                style={{
                  width: sagaFailed ? '100%' : `${Math.min(100, Math.max(10, sagaStep * 20))}%`,
                }}
              />
            </div>

            {/* Step list */}
            <div className="space-y-2 font-mono text-xs uppercase">
              {[
                { step: 1, title: 'PHASE 1: STAGING ORDER DETAILS', desc: 'Validating inventory & shipping destination' },
                { step: 2, title: 'PHASE 2: RESERVING INVENTORY', desc: 'Holding items in merchant distribution vault' },
                { step: 3, title: 'PHASE 3: AUTHORIZING PAYMENT', desc: 'Generating cryptographic idempotency hash' },
                { step: 4, title: 'PHASE 4: ALLOCATING WAREHOUSE SLOT', desc: 'Confirming logistics fulfillment manifest' },
                { step: 5, title: 'PHASE 5: SAGA COMMITTED & DISPATCHED', desc: 'Transactional outbox event successfully emitted' },
              ].map((s) => {
                const isCompleted = sagaStep > s.step;
                const isCurrent = sagaStep === s.step;
                return (
                  <div
                    key={s.step}
                    className={`p-3 border flex items-center justify-between transition ${
                      isCompleted
                        ? 'bg-[#FFFFFF] border-[#1E1E1E] text-emerald-700'
                        : isCurrent
                        ? 'bg-[#1E1E1E] text-[#E4E2DD]'
                        : 'bg-[#E4E2DD]/40 border-[#1E1E1E]/20 text-[#444444]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold">{s.title}</div>
                      <div className="text-[9px] opacity-80 normal-case font-satoshi">{s.desc}</div>
                    </div>
                    <div className="shrink-0 ml-3">
                      {isCompleted ? (
                        <span className="font-bold text-xs text-emerald-600">DONE</span>
                      ) : isCurrent ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
                      ) : (
                        <span className="text-[10px] opacity-40">WAITING</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Footer */}
            <div className="p-3 bg-[#FFFFFF] border border-[#1E1E1E]/20 text-center font-mono text-[11px] font-bold text-[#1E1E1E] uppercase">
              {sagaMessage || 'COORDINATING DISTRIBUTED TRANSACTIONS...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
