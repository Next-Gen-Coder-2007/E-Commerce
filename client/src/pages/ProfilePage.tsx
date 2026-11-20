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
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SavedAddress } from '../types/auth';
import { RawAtmosphere } from '../components/RawAtmosphere';
import { BrutalistButton } from '../components/BrutalistButton';

const AVAILABLE_PROMOS = [
  {
    code: 'NOVA10',
    title: '10% OFF SITEWIDE',
    description: 'Instant 10% markdown applied on all store categories.',
    badge: 'SITEWIDE',
  },
  {
    code: 'SPRING20',
    title: '20% MEGA SEASON SALE',
    description: 'Save 20% on all orders over $150 during the promotional drop.',
    badge: 'SEASONAL',
  },
  {
    code: 'FREESHIP',
    title: '100% FREE SHIPPING',
    description: 'Waives all courier and express delivery fees at checkout.',
    badge: 'FREIGHT',
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
        setProfileMsg({ text: 'ACCOUNT DETAILS UPDATED SUCCESSFULLY', type: 'success' });
      } else {
        setProfileMsg({ text: 'FAILED TO UPDATE ACCOUNT DETAILS', type: 'error' });
      }
    } catch (err: any) {
      setProfileMsg({ text: err.message || 'ERROR UPDATING PROFILE', type: 'error' });
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
    <div className="min-h-screen bg-[#E4E2DD] text-[#1E1E1E] font-satoshi py-10 px-4 sm:px-6 lg:px-10 relative select-none">
      <RawAtmosphere variant="subtle" />

      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b-2 border-[#1E1E1E]">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#DB4A2B] block">
              IDENTITY & DESTINATION DIRECTORY
            </span>
            <h1 className="font-clash text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#1E1E1E] mt-0.5">
              CUSTOMER ACCOUNT
            </h1>
            <p className="text-xs text-[#444444] font-mono uppercase mt-1">
              MANAGE DELIVERY DESTINATIONS &bull; ACTIVE VOUCHERS &bull; CREDENTIALS
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/orders"
              className="px-5 py-2.5 bg-[#FFFFFF] border-2 border-[#1E1E1E] hover:bg-[#1E1E1E] hover:text-[#E4E2DD] text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              <span>ORDER DISPATCHES</span>
            </Link>
            <Link
              to="/"
              className="raw-btn px-6 py-2.5 bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E] text-xs font-bold uppercase tracking-widest"
            >
              CATALOG
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Account Details & Address Book (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* 1. Account Details Form */}
            <div className="bg-[#FFFFFF] border-2 border-[#1E1E1E] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E1E1E]/15">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1E1E1E] text-[#E4E2DD] flex items-center justify-center font-bold text-xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-clash text-base font-bold uppercase tracking-tight text-[#1E1E1E]">
                      PRIMARY CREDENTIALS
                    </h2>
                    <p className="text-[10px] font-mono text-[#444444] uppercase">
                      NAME & DISPATCH CONTACT NUMBER
                    </p>
                  </div>
                </div>
              </div>

              {profileMsg && (
                <div
                  className={`p-3.5 border text-xs font-mono font-bold uppercase flex items-center gap-2 ${
                    profileMsg.type === 'success'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#DB4A2B]'
                  }`}
                >
                  {profileMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#DB4A2B] shrink-0" />
                  )}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 font-mono text-left">
                    <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-wider">
                      FULL NAME
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#E4E2DD]/30 border border-[#1E1E1E]/30 text-xs font-satoshi uppercase text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E]"
                    />
                  </div>

                  <div className="space-y-1 font-mono text-left">
                    <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-wider">
                      PHONE NUMBER (FOR COURIER ALERTS)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3.5 py-2.5 bg-[#E4E2DD]/30 border border-[#1E1E1E]/30 text-xs font-mono text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E]"
                    />
                  </div>
                </div>

                <div className="space-y-1 font-mono text-left">
                  <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-wider">
                    AUTHENTICATED EMAIL
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3.5 py-2.5 bg-[#D9D6D0]/50 border border-[#1E1E1E]/20 text-xs font-mono text-[#444444] cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="raw-btn px-6 py-3 bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E] text-xs font-bold uppercase tracking-widest cursor-pointer"
                >
                  {savingProfile ? 'UPDATING...' : 'SAVE DETAILS'}
                </button>
              </form>
            </div>

            {/* 2. Saved Addresses Directory */}
            <div className="bg-[#FFFFFF] border-2 border-[#1E1E1E] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E1E1E]/15">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1E1E1E] text-[#E4E2DD] flex items-center justify-center font-bold text-xs">
                    <MapPin className="w-4 h-4 text-[#DB4A2B]" />
                  </div>
                  <div>
                    <h2 className="font-clash text-base font-bold uppercase tracking-tight text-[#1E1E1E]">
                      DESTINATION BOOK ({savedAddresses.length})
                    </h2>
                    <p className="text-[10px] font-mono text-[#444444] uppercase">
                      SHIPPING & DISPATCH RECEPTACLES
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openNewAddressModal}
                  className="px-4 py-2 bg-[#1E1E1E] hover:bg-[#DB4A2B] text-[#E4E2DD] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD ADDRESS</span>
                </button>
              </div>

              {savedAddresses.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-[#1E1E1E]/30 p-6 space-y-2">
                  <MapPin className="w-8 h-8 text-[#444444] mx-auto" />
                  <p className="text-xs font-mono uppercase font-bold text-[#1E1E1E]">NO SAVED DESTINATIONS</p>
                  <p className="text-xs text-[#444444]">Add a delivery destination for one-click checkout.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`p-4 border transition-all relative flex flex-col justify-between ${
                        addr.isDefault
                          ? 'border-2 border-[#1E1E1E] bg-[#E4E2DD]/30'
                          : 'border border-[#1E1E1E]/20 bg-[#FFFFFF]'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold uppercase bg-[#1E1E1E] text-[#E4E2DD] px-2 py-0.5">
                            {addr.label || 'DESTINATION'}
                          </span>
                          {addr.isDefault ? (
                            <span className="text-[10px] font-mono font-bold text-[#DB4A2B] uppercase">
                              PRIMARY
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addr._id && setDefaultAddress(addr._id)}
                              className="text-[10px] font-mono text-[#444444] hover:text-[#1E1E1E] uppercase underline cursor-pointer"
                            >
                              SET PRIMARY
                            </button>
                          )}
                        </div>

                        <div className="font-clash text-sm font-bold uppercase text-[#1E1E1E] pt-1">
                          {addr.fullName}
                        </div>
                        <div className="text-xs text-[#444444] leading-relaxed">
                          {addr.addressLine1}
                          {addr.addressLine2 && `, ${addr.addressLine2}`}
                          <br />
                          {addr.city}, {addr.state} {addr.postalCode}
                          <br />
                          {addr.country}
                        </div>
                        <div className="font-mono text-[10px] text-[#444444]">
                          TEL: {addr.phone}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#1E1E1E]/10 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditAddressModal(addr)}
                          className="p-1.5 text-[#444444] hover:text-[#1E1E1E] transition cursor-pointer"
                          title="Edit destination"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => addr._id && deleteSavedAddress(addr._id)}
                          className="p-1.5 text-[#444444] hover:text-[#DB4A2B] transition cursor-pointer"
                          title="Delete destination"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Vouchers & Security (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Active Voucher Codes */}
            <div className="bg-[#FFFFFF] border-2 border-[#1E1E1E] p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#1E1E1E]/15 pb-3">
                <Tag className="w-4 h-4 text-[#DB4A2B]" />
                <h3 className="font-clash text-sm font-bold uppercase tracking-tight text-[#1E1E1E]">
                  PROMOTIONAL PRIVILEGES
                </h3>
              </div>

              <div className="space-y-3 font-mono">
                {AVAILABLE_PROMOS.map((promo) => (
                  <div
                    key={promo.code}
                    className="p-3.5 bg-[#E4E2DD]/40 border border-[#1E1E1E]/20 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#1E1E1E]">{promo.code}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyCoupon(promo.code)}
                        className="text-[10px] font-bold uppercase text-[#DB4A2B] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCode === promo.code ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode === promo.code ? 'COPIED' : 'COPY'}</span>
                      </button>
                    </div>
                    <div className="text-[11px] font-bold text-[#1E1E1E] uppercase">{promo.title}</div>
                    <p className="text-[10px] text-[#444444] normal-case">{promo.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Microservice Security Badge */}
            <div className="p-5 bg-[#1E1E1E] text-[#E4E2DD] border-2 border-[#1E1E1E] space-y-2 font-mono text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase">
                <span className="w-2 h-2 bg-emerald-500 animate-pulse" />
                <span>PCI-DSS ENCRYPTED</span>
              </div>
              <p className="text-[11px] text-[#E4E2DD]/70 leading-relaxed normal-case">
                Your payment cards and address credentials are bound to authenticated sessions using modern JWT HTTP-only cryptography.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Address Edit/Create Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1E1E]/75 backdrop-blur-xs font-satoshi">
          <div className="relative w-full max-w-lg bg-[#E4E2DD] border-2 border-[#1E1E1E] shadow-2xl p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#1E1E1E]">
              <h3 className="font-clash text-lg font-bold uppercase text-[#1E1E1E]">
                {editingAddressId ? 'MODIFY DESTINATION' : 'ADD NEW DESTINATION'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1 text-[#1E1E1E] hover:text-[#DB4A2B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addressError && (
              <div className="p-3 border-2 border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#DB4A2B] text-xs font-mono font-bold uppercase flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addressError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-3.5 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1E1E1E] uppercase">LABEL</label>
                  <input
                    type="text"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    placeholder="Home / Studio"
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#1E1E1E]/30 focus:outline-none focus:border-[#1E1E1E]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#1E1E1E] uppercase">RECIPIENT NAME</label>
                  <input
                    type="text"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#1E1E1E]/30 focus:outline-none focus:border-[#1E1E1E]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E1E1E] uppercase">PHONE (REQUIRED)</label>
                <input
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#1E1E1E]/30 focus:outline-none focus:border-[#1E1E1E]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E1E1E] uppercase">STREET ADDRESS</label>
                <input
                  type="text"
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  placeholder="Street number and name"
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#1E1E1E]/30 focus:outline-none focus:border-[#1E1E1E]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-[#1E1E1E] uppercase">CITY</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-2.5 py-2 bg-[#FFFFFF] border border-[#1E1E1E]/30 focus:outline-none focus:border-[#1E1E1E]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#1E1E1E] uppercase">STATE</label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-2.5 py-2 bg-[#FFFFFF] border border-[#1E1E1E]/30 focus:outline-none focus:border-[#1E1E1E]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#1E1E1E] uppercase">POSTAL CODE</label>
                  <input
                    type="text"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    className="w-full px-2.5 py-2 bg-[#FFFFFF] border border-[#1E1E1E]/30 focus:outline-none focus:border-[#1E1E1E]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefaultAddr"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-4 h-4 accent-[#1E1E1E]"
                />
                <label htmlFor="isDefaultAddr" className="text-xs uppercase font-bold text-[#1E1E1E] cursor-pointer">
                  SET AS PRIMARY DISPATCH DESTINATION
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2.5 border border-[#1E1E1E]/30 text-xs font-bold uppercase hover:bg-[#FFFFFF]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={addressSubmitting}
                  className="raw-btn px-6 py-2.5 bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E] text-xs font-bold uppercase tracking-widest cursor-pointer"
                >
                  {addressSubmitting ? 'SAVING...' : 'SAVE DESTINATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
