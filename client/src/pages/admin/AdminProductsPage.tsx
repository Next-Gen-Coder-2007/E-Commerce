import React, { useState, useEffect } from 'react';
import { Search, Eye, EyeOff } from 'lucide-react';
import { getProductsApi } from '../../services/productService';
import { moderateProductApi } from '../../services/adminService';
import type { Product } from '../../types/product';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProducts = () => {
    getProductsApi({ search: search.trim() || undefined, limit: 30 })
      .then((data) => setProducts(data.products || []))
      .catch((err) => console.warn('Products fetch error:', err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleTogglePublish = async (productId: string, currentPublished: boolean) => {
    setActionLoading(productId);
    try {
      await moderateProductApi(productId, { isPublished: !currentPublished });
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, isPublished: !currentPublished } : p))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to moderate product');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#1E1E1E] pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 bg-[#1E1E1E] text-white">
            CATALOG AUDIT
          </span>
          <h2 className="text-2xl sm:text-3xl font-clash font-bold uppercase tracking-tight text-[#1E1E1E] mt-1">
            Product Moderation Ledger
          </h2>
          <p className="text-xs font-mono text-[#444444] uppercase tracking-wider">
            Review listed inventory authenticity, enforce safety standards, and moderate publication status.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchProducts();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product title..."
            className="px-3.5 py-2 border-2 border-[#1E1E1E] bg-white text-xs font-mono text-[#1E1E1E] focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 border-2 border-[#1E1E1E] bg-[#1E1E1E] text-white text-xs font-mono font-bold uppercase hover:bg-[#DB4A2B] transition cursor-pointer"
          >
            Audit Filter
          </button>
        </form>
      </div>

      <div className="border-2 border-[#1E1E1E] bg-white shadow-[6px_6px_0px_#1E1E1E] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#D9D6D0] text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E] border-b-2 border-[#1E1E1E]">
              <tr>
                <th className="p-4">Product Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-[#E4E2DD]/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                        alt={p.title}
                        className="w-12 h-14 border border-[#1E1E1E] object-cover bg-[#E4E2DD] shrink-0 p-0.5"
                      />
                      <div className="min-w-0">
                        <div className="font-clash font-bold text-sm text-[#1E1E1E] uppercase truncate max-w-xs">
                          {p.title}
                        </div>
                        <div className="text-[10px] text-[#444444]">BRAND: {p.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-[#1E1E1E] font-bold uppercase">{p.category}</td>
                  <td className="p-4 font-clash font-bold text-sm text-[#1E1E1E]">
                    ${p.price.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${
                        p.isPublished !== false
                          ? 'border-[#1E1E1E] bg-[#1E1E1E] text-white'
                          : 'border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#DB4A2B]'
                      }`}
                    >
                      {p.isPublished !== false ? 'LIVE PUBLISHED' : 'SUPPRESSED'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      disabled={actionLoading === p._id}
                      onClick={() => handleTogglePublish(p._id, p.isPublished !== false)}
                      className="px-3 py-1 border-2 border-[#1E1E1E] bg-white hover:bg-[#1E1E1E] hover:text-white font-bold uppercase transition shadow-[2px_2px_0px_#1E1E1E] cursor-pointer"
                    >
                      {p.isPublished !== false ? 'Suppress from Index' : 'Approve for Index'}
                    </button>
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

export default AdminProductsPage;
