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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">Cross-Store Orders & Refunds</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Audit distributed Saga transactions, inspect compensation timelines, and manage refunds.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950 transition cursor-pointer shadow-xs"
          title="Refresh Orders"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-700">
            <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-200/80">
              <tr>
                <th className="p-4">Order Reference</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Saga Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-zinc-50/60 transition">
                  <td className="p-4 font-mono font-bold text-zinc-900">{o._id}</td>
                  <td className="p-4 font-medium text-zinc-800">
                    {typeof o.userId === 'object' ? o.userId.name : 'Customer'}
                  </td>
                  <td className="p-4 font-mono font-bold text-zinc-950">
                    ${(o.totalPrice || o.totalAmount || 0).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        o.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : o.status === 'shipped' || o.status === 'processing'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : o.status === 'cancelled' || o.status === 'refunded'
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-500 text-[11px]">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <select
                      value={o.status}
                      disabled={actionLoading === o._id}
                      onChange={(e) => handleStatusOverride(o._id, e.target.value)}
                      className="bg-white border border-zinc-200 text-zinc-800 text-xs rounded-lg px-2.5 py-1 cursor-pointer shadow-2xs"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>

                    {o.status !== 'refunded' && (
                      <button
                        onClick={() => handleRefund(o._id)}
                        disabled={actionLoading === o._id}
                        className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-bold transition cursor-pointer"
                      >
                        Refund
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
