import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Tag,
  Package,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SavedAddress } from '../types/auth';

const AVAILABLE_PROMOS = [
  {
    code: 'NOVA10',
    title: '10% Off Everything',
    description: 'Instant 10% markdown applied on all store categories.',
    badge: 'Sitewide',
  },
  {
    code: 'SPRING20',
    title: '20% Mega Season Sale',
    description: 'Save 20% on all orders during the current promotional period.',
    badge: 'Seasonal',
  },
  {
    code: 'FREESHIP',
    title: '100% Free Shipping',
    description: 'Waives all courier and express delivery fees at checkout.',
    badge: 'Free Shipping',
  },
];

export const ProfilePage: React.FC = () => {
  const {
    user,
    updateProfile,
    addSavedAddress,
    updateSavedAddress,
    deleteSavedAddress,
    setDefaultAddress,
  } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Address Modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<SavedAddress>({
    label: 'Home',
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    isDefault: false,
  });
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressSubmitting, setAddressSubmitting] = useState(false);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const ok = await updateProfile({ name, phone: phone.trim() });
      if (ok) {
        setProfileMsg({ text: 'Account details updated successfully!', type: 'success' });
      } else {
        setProfileMsg({ text: 'Failed to update account details.', type: 'error' });
      }
    } catch (err: any) {
      setProfileMsg({ text: err.message || 'Error updating profile', type: 'error' });
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg(null), 4000);
    }
  };

  const openNewAddressModal = () => {
    setEditingAddressId(null);
    setAddressForm({
      label: 'Home',
      fullName: user?.name || '',
      phone: user?.phone || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      isDefault: (user?.savedAddresses || []).length === 0,
    });
    setAddressError(null);
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: SavedAddress) => {
    if (!addr._id) return;
    setEditingAddressId(addr._id);
    setAddressForm({
      label: addr.label || 'Home',
      fullName: addr.fullName,
      phone: addr.phone || '',
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country || 'United States',
      isDefault: !!addr.isDefault,
    });
    setAddressError(null);
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);

    // Mandatory phone validation
    if (!addressForm.phone || !addressForm.phone.trim()) {
      setAddressError('Contact phone number is required for courier delivery updates.');
      return;
    }

    if (
      !addressForm.fullName.trim() ||
      !addressForm.addressLine1.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim() ||
      !addressForm.postalCode.trim()
    ) {
      setAddressError('Please fill in all mandatory address fields.');
      return;
    }

    setAddressSubmitting(true);
    try {
      if (editingAddressId) {
        await updateSavedAddress(editingAddressId, addressForm);
      } else {
        await addSavedAddress(addressForm);
      }
      setIsAddressModalOpen(false);
    } catch (err: any) {
      setAddressError(err.message || 'Failed to save address.');
    } finally {
      setAddressSubmitting(false);
    }
  };

  const savedAddresses = user?.savedAddresses || [];

  return (
    <div className="min-h-screen bg-zinc-50/70 pb-20 pt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-950">
              Customer Account & Address Book
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Manage your personal shopper information, saved delivery destinations, and active coupon perks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-100 transition-colors shadow-2xs"
            >
              <Package className="w-4 h-4 text-zinc-700" />
              <span>My Orders</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <span>Explore Store</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Account Details & Address Book (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Account Details Form */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-zinc-950">
                      Personal Account Details
                    </h2>
                    <p className="text-[11px] text-zinc-500">
                      Primary contact information associated with your orders
                    </p>
                  </div>
                </div>
              </div>

              {profileMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in ${
                    profileMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {profileMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Contact Phone (Mandatory for Couriers) *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000 / 9876543210"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Email Address (Account ID)
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        disabled
                        value={user?.email || ''}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-100 text-xs text-zinc-500 cursor-not-allowed font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {savingProfile ? 'Saving...' : 'Update Account Info'}
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Saved Address Book */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-xs">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-zinc-950">
                      Saved Delivery Addresses ({savedAddresses.length})
                    </h2>
                    <p className="text-[11px] text-zinc-500">
                      All addresses have required contact phone numbers attached for instant checkout
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openNewAddressModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Address</span>
                </button>
              </div>

              {savedAddresses.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-zinc-200 rounded-2xl space-y-3">
                  <MapPin className="w-8 h-8 text-zinc-300 mx-auto" />
                  <p className="text-xs font-medium text-zinc-500">
                    No delivery addresses saved yet. Add one to accelerate your checkout process!
                  </p>
                  <button
                    type="button"
                    onClick={openNewAddressModal}
                    className="inline-flex items-center gap-1 text-xs font-bold text-zinc-950 hover:underline"
                  >
                    + Add your first address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr._id}
                      className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 transition-all space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-zinc-950 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-700" />
                          <span>{addr.label || 'Home'}</span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Default
                            </span>
                          )}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditAddressModal(addr)}
                            className="p-1 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                            title="Edit Address"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {addr._id && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Are you sure you want to remove this address?')) {
                                  deleteSavedAddress(addr._id!);
                                }
                              }}
                              className="p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Address"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-xs space-y-0.5">
                        <p className="font-bold text-zinc-900">{addr.fullName}</p>
                        <p className="text-zinc-600 font-mono text-[11px] font-semibold">
                          Tel: {addr.phone}
                        </p>
                        <p className="text-zinc-500">
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                        </p>
                        <p className="text-zinc-500">
                          {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                      </div>

                      {!addr.isDefault && addr._id && (
                        <button
                          type="button"
                          onClick={() => setDefaultAddress(addr._id!)}
                          className="text-[10px] font-bold text-zinc-700 hover:text-zinc-950 underline cursor-pointer"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Promo Coupons & Platform Perks (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
                <Tag className="w-4 h-4 text-zinc-950" />
                <h3 className="text-sm font-black text-zinc-950 uppercase tracking-wider">
                  Active Coupons
                </h3>
              </div>

              <div className="space-y-3">
                {AVAILABLE_PROMOS.map((promo) => {
                  const isCopied = copiedCode === promo.code;
                  return (
                    <div
                      key={promo.code}
                      className="p-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/60 hover:bg-zinc-50 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-200/80 text-zinc-800 px-2 py-0.5 rounded-full">
                          {promo.badge}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCoupon(promo.code)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-black">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-0.5">
                        <div className="font-mono text-xs font-black text-zinc-950">
                          {promo.code}
                        </div>
                        <p className="text-xs font-bold text-zinc-900">
                          {promo.title}
                        </p>
                        <p className="text-[11px] text-zinc-500 leading-snug">
                          {promo.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Applied at checkout</span>
                </span>
                <Link
                  to="/"
                  className="font-bold text-zinc-900 hover:underline"
                >
                  Shop Now →
                </Link>
              </div>
            </div>

            {/* Security Guarantee Box */}
            <div className="bg-zinc-900 text-white rounded-2xl p-6 space-y-3 shadow-xs border border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  Secure Customer Vault
                </h4>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                All saved contact numbers, address credentials, and profile settings are stored with high-grade 256-bit encryption.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Address Add / Edit Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 animate-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-black text-zinc-950">
                {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addressError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{addressError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase">
                    Address Label
                  </label>
                  <input
                    type="text"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    placeholder="Home, Office, Warehouse"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-700 uppercase">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-700 uppercase">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  placeholder="123 Main Street"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-700 uppercase">
                  Apartment, suite, unit (optional)
                </label>
                <input
                  type="text"
                  value={addressForm.addressLine2 || ''}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  placeholder="Suite 400"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="San Francisco"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    placeholder="CA"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    placeholder="94103"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault || false}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded text-zinc-950 border-zinc-300 focus:ring-zinc-950"
                />
                <span className="text-xs font-bold text-zinc-800">
                  Set as default delivery address
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressSubmitting}
                  className="px-5 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {addressSubmitting ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
