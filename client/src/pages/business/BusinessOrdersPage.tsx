import React, { useState, useEffect } from 'react';
import { getOrdersApi } from '../../services/orderService';
import type { Order } from '../../types/order';

export const BusinessOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrdersApi()
      .then((data) => setOrders(data.orders || []))
      .catch((err) => console.warn('Fetch orders error:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-zinc-900">Merchant Store Orders</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Review customer purchases, prepare shipping parcels, and fulfill warehouse dispatches.
        </p>
      </div>

      <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-700">
            <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-200/80">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Items Ordered</th>
                <th className="p-4">Order Total</th>
                <th className="p-4">Saga Fulfillment Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-zinc-50/60 transition">
                  <td className="p-4 font-mono font-bold text-zinc-900">{o._id}</td>
                  <td className="p-4">
                    <div className="font-bold text-zinc-900">
                      {o.shippingAddress?.fullName || 'Valued Customer'}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {o.shippingAddress?.city}, {o.shippingAddress?.country}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-zinc-700 font-medium">
                      {o.orderItems?.length || 1} distinct item(s)
                    </div>
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
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <a
                      href={`/orders/${o._id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold transition inline-block shadow-2xs"
                    >
                      View Details
                    </a>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-400">
                    No orders recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BusinessOrdersPage;
