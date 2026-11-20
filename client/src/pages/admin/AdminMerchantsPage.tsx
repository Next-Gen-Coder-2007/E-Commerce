import React, { useState, useEffect } from 'react';
import { Check, X, ExternalLink, Building2 } from 'lucide-react';
import {
  getAdminMerchantsApi,
  verifyMerchantApi,
  AdminMerchant,
} from '../../services/adminService';

export const AdminMerchantsPage: React.FC = () => {
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMerchants = () => {
    getAdminMerchantsApi()
      .then((data) => setMerchants(data.merchants || []))
      .catch((err) => console.warn('Merchants fetch error:', err));
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const handleVerify = async (userId: string, isApproved: boolean) => {
    setActionLoading(userId);
    try {
      await verifyMerchantApi(userId, isApproved);
      setMerchants((prev) =>
        prev.map((m) =>
          m._id === userId
            ? { ...m, isVerifiedMerchant: isApproved, storeStatus: isApproved ? 'approved' : 'rejected' }
            : m
        )
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update merchant verification status');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-[#1E1E1E] pb-4">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 bg-[#1E1E1E] text-white">
          MERCHANT APPROVALS
        </span>
        <h2 className="text-2xl sm:text-3xl font-clash font-bold uppercase tracking-tight text-[#1E1E1E] mt-1">
          Merchant Store Approvals
        </h2>
        <p className="text-xs font-mono text-[#444444] uppercase tracking-wider">
          Review business registration, store information, and approve seller privileges.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {merchants.map((m) => (
          <div
            key={m._id}
            className="p-6 bg-white border-2 border-[#1E1E1E] space-y-4 shadow-[4px_4px_0px_#1E1E1E] flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 border-2 border-[#1E1E1E] bg-[#E4E2DD] flex items-center justify-center font-clash font-bold text-sm uppercase">
                  {m.companyName?.charAt(0) || m.name.charAt(0)}
                </div>
                <span
                  className={`px-2 py-0.5 border text-[10px] font-mono font-bold uppercase ${
                    m.isVerifiedMerchant
                      ? 'border-[#1E1E1E] bg-[#1E1E1E] text-white'
                      : 'border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#DB4A2B]'
                  }`}
                >
                  {m.isVerifiedMerchant ? 'VERIFIED STORE' : 'PENDING APPROVAL'}
                </span>
              </div>

              <div>
                <h3 className="font-clash font-bold text-base text-[#1E1E1E] uppercase">
                  {m.companyName || m.name}
                </h3>
                <p className="text-xs font-mono text-[#444444] mt-0.5">
                  EMAIL: {m.email}
                </p>
              </div>

              {m.storeDescription && (
                <p className="text-xs font-satoshi text-[#444444] line-clamp-3 bg-[#E4E2DD] p-2 border border-zinc-300">
                  {m.storeDescription}
                </p>
              )}
            </div>

            <div className="pt-3 border-t-2 border-[#1E1E1E] flex items-center gap-2">
              <button
                type="button"
                disabled={actionLoading === m._id}
                onClick={() => handleVerify(m._id, true)}
                className="flex-1 py-2 border-2 border-[#1E1E1E] bg-[#1E1E1E] hover:bg-[#DB4A2B] text-white text-xs font-mono font-bold uppercase transition cursor-pointer shadow-[2px_2px_0px_#1E1E1E]"
              >
                Approve Store
              </button>
              <button
                type="button"
                disabled={actionLoading === m._id}
                onClick={() => handleVerify(m._id, false)}
                className="px-3 py-2 border-2 border-[#DB4A2B] text-[#DB4A2B] hover:bg-[#DB4A2B] hover:text-white text-xs font-mono font-bold uppercase transition cursor-pointer"
                title="Revoke accreditation"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMerchantsPage;
