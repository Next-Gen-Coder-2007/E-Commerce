import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  getAdminOrdersApi,
  overrideOrderStatusApi,
  refundAdminOrderApi,
  AdminOrder,
} from '../../services/adminService';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = () => {
    getAdminOrdersApi()
      .then((data) => setOrders(data.orders || []))
      .catch((err) => console.warn('Orders fetch error:', err));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusOverride = async (orderId: string, status: string) => {
    setActionLoading(orderId);
    try {
      await overrideOrderStatusApi(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: status as any } : o))
      );
    } catch (err: any) {
      alert(err.message || 'Status override failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm('Are you sure you want to execute an administrative refund for this order?')) return;
    setActionLoading(orderId);
    try {
      await refundAdminOrderApi(orderId, 'Administrative manual refund approved');
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: 'refunded' as any } : o))
      );
    } catch (err: any) {
      alert(err.message || 'Refund execution failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#1E1E1E] pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 bg-[#1E1E1E] text-white">
            ESCROW & REVERSALS
          </span>
          <h2 className="text-2xl sm:text-3xl font-clash font-bold uppercase tracking-tight text-[#1E1E1E] mt-1">
            Orders & Escrow Intervention
          </h2>
          <p className="text-xs font-mono text-[#444444] uppercase tracking-wider">
            Monitor distributed Saga transaction states, execute manual status overrides, and release refunds.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-[#1E1E1E] bg-white hover:bg-[#1E1E1E] hover:text-white text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_#1E1E1E] transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Synchronize Ledger</span>
        </button>
      </div>

      <div className="border-2 border-[#1E1E1E] bg-white shadow-[6px_6px_0px_#1E1E1E] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#D9D6D0] text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E] border-b-2 border-[#1E1E1E]">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-[#E4E2DD]/40 transition-colors">
                  <td className="p-4 font-bold text-[#1E1E1E]">
                    #{o._id.slice(-8).toUpperCase()}
                  </td>
                  <td className="p-4">
                    <div className="font-clash font-bold text-[#1E1E1E] uppercase">
                      {o.shippingAddress?.fullName || 'Customer'}
                    </div>
                    <div className="text-[10px] text-[#444444]">
                      {o.shippingAddress?.city}, {o.shippingAddress?.country}
                    </div>
                  </td>
                  <td className="p-4 font-clash font-bold text-sm text-[#1E1E1E]">
                    ${(o.totalPrice || o.totalAmount || 0).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <select
                      value={o.status}
                      disabled={actionLoading === o._id}
                      onChange={(e) => handleStatusOverride(o._id, e.target.value)}
                      className="border border-[#1E1E1E] bg-white px-2 py-1 text-xs font-mono font-bold uppercase focus:outline-none cursor-pointer"
                    >
                      <option value="placed">Placed</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {o.status !== 'refunded' && (
                      <button
                        type="button"
                        disabled={actionLoading === o._id}
                        onClick={() => handleRefund(o._id)}
                        className="px-3 py-1 border-2 border-[#DB4A2B] bg-[#DB4A2B]/10 hover:bg-[#DB4A2B] hover:text-white text-[#DB4A2B] text-xs font-mono font-bold uppercase transition cursor-pointer"
                      >
                        Force Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
