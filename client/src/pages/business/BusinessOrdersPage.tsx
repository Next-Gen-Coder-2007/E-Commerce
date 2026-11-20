import React, { useState, useEffect } from 'react';
import { getOrdersApi } from '../../services/orderService';
import type { Order } from '../../types/order';
import { ShoppingCart, Eye, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      <div className="space-y-1 border-b-2 border-[#1E1E1E] pb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 bg-[#1E1E1E] text-white">
            LOGISTICS FULFILLMENT
          </span>
          <span className="text-[10px] font-mono text-[#444444] uppercase">
            LEDGER DISPATCHES
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-clash font-bold uppercase tracking-tight text-[#1E1E1E]">
          Store Orders Ledger
        </h2>
        <p className="text-xs font-mono text-[#444444] uppercase tracking-wider">
          Review customer orders, inspect tracking waybills, and manage fulfillment states.
        </p>
      </div>

      <div className="border-2 border-[#1E1E1E] bg-white shadow-[6px_6px_0px_#1E1E1E] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#D9D6D0] text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E] border-b-2 border-[#1E1E1E]">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Items Ordered</th>
                <th className="p-4">Order Total</th>
                <th className="p-4">Fulfillment Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-[#E4E2DD]/40 transition-colors">
                  <td className="p-4 font-bold text-[#1E1E1E]">
                    #{o.orderNumber || o._id.slice(-8).toUpperCase()}
                  </td>
                  <td className="p-4">
                    <div className="font-clash font-bold text-[#1E1E1E] uppercase">
                      {o.shippingAddress?.fullName || 'Customer'}
                    </div>
                    <div className="text-[10px] text-[#444444]">
                      {o.shippingAddress?.city}, {o.shippingAddress?.country}
                    </div>
                  </td>
                  <td className="p-4 text-[#1E1E1E]">
                    {o.orderItems?.reduce((acc, it) => acc + (it.quantity || 1), 0) || 1} units ({o.orderItems?.length || 1} items)
                  </td>
                  <td className="p-4 font-bold font-clash text-sm text-[#1E1E1E]">
                    ${(o.totalPrice || o.totalAmount || (o.pricing?.totalPrice) || 0).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 border text-[10px] font-bold uppercase tracking-wider ${
                        o.status === 'delivered'
                          ? 'border-[#1E1E1E] bg-[#1E1E1E] text-white'
                          : o.status === 'shipped' || o.status === 'processing'
                          ? 'border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#DB4A2B]'
                          : 'border-zinc-400 bg-[#D9D6D0] text-[#1E1E1E]'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      to={`/orders/${o._id}`}
                      className="px-3.5 py-1.5 border-2 border-[#1E1E1E] bg-white hover:bg-[#1E1E1E] hover:text-white text-[#1E1E1E] font-bold uppercase transition inline-block shadow-[2px_2px_0px_#1E1E1E]"
                    >
                      View Order
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[#444444] font-mono">
                    NO ORDERS RECORDED IN CURRENT STORE DATABASE.
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
