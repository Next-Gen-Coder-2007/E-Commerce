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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">Catalog Moderation</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Audit merchant product listings, review quality standards, and enforce compliance.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchProducts();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search catalog by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-zinc-200 text-xs text-zinc-900 rounded-xl pl-9 pr-3.5 py-2 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 shadow-xs"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
          >
            Search
          </button>
        </form>
      </div>

      <div className="bg-white border border-zinc-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-700">
            <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-200/80">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Merchant Store</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price / Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-zinc-50/60 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image || 'https://via.placeholder.com/40'}
                        alt={p.title}
                        className="w-10 h-10 rounded-xl object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <a
                          href={`/product/${p._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-zinc-900 hover:text-indigo-600 transition truncate block max-w-xs"
                        >
                          {p.title}
                        </a>
                        <div className="text-[11px] text-zinc-400">{p.brand || 'Unbranded'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-800 font-medium">
                    {p.companyName || 'Verified Merchant'}
                  </td>
                  <td className="p-4 uppercase text-[10px] font-bold text-indigo-600 tracking-wider">
                    {p.category}
                  </td>
                  <td className="p-4">
                    <div className="font-mono font-bold text-zinc-950">${p.price.toFixed(2)}</div>
                    <div className="text-[11px] text-zinc-500">{p.stock} in stock</div>
                  </td>
                  <td className="p-4">
                    {p.isPublished !== false ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Published
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                        Delisted
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleTogglePublish(p._id, p.isPublished !== false)}
                      disabled={actionLoading === p._id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer ${
                        p.isPublished !== false
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {p.isPublished !== false ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Delist</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Publish</span>
                        </>
                      )}
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
