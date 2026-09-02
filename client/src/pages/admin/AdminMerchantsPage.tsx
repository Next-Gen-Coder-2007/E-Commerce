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
      <div>
        <h2 className="text-2xl font-black tracking-tight text-zinc-900">Merchant Store Approvals</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Review business registration licenses, storefront descriptions, and grant merchant privileges.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {merchants.map((m) => (
          <div
            key={m._id}
            className="p-6 bg-white border border-zinc-200/80 rounded-3xl space-y-4 shadow-xs hover:border-zinc-300 transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm">{m.companyName || m.name}</h4>
                    <div className="text-[11px] text-zinc-400">{m.email}</div>
                  </div>
                </div>

                {m.isVerifiedMerchant ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    Verified
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    Pending
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                {m.companyDescription || 'Storefront description awaiting submission.'}
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-2">
              <a
                href={`/store/${m._id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold transition"
              >
                <span>Storefront</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleVerify(m._id, false)}
                  disabled={actionLoading === m._id}
                  className="p-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition cursor-pointer"
                  title="Reject Store"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleVerify(m._id, true)}
                  disabled={actionLoading === m._id}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMerchantsPage;
