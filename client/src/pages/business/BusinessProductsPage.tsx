import React, { useState, useEffect } from 'react';
import { Plus, Eye } from 'lucide-react';
import { getProductsApi, createProductApi } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import type { Product } from '../../types/product';

export const BusinessProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'electronics',
    stock: '25',
    image: '',
    brand: '',
  });

  const fetchMyProducts = () => {
    getProductsApi({ limit: 50 })
      .then((data) => {
        const list = data.products || [];
        setProducts(list);
      })
      .catch((err) => console.warn('Fetch products error:', err));
  };

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProductApi({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock, 10),
        image: formData.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        brand: formData.brand || user?.companyName || 'My Brand',
      });
      setShowAddModal(false);
      setFormData({
        title: '',
        description: '',
        price: '',
        category: 'electronics',
        stock: '25',
        image: '',
        brand: '',
      });
      fetchMyProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to create product listing');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">Product Catalog & Inventory</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Manage your store's listings, track warehouse stock levels, and set promotional discounts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-700">
            <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-200/80">
              <tr>
                <th className="p-4">Product Listing</th>
                <th className="p-4">Category</th>
                <th className="p-4">Unit Price</th>
                <th className="p-4">Stock Level</th>
                <th className="p-4">Customer Rating</th>
                <th className="p-4 text-right">Actions</th>
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
                        <div className="font-bold text-zinc-900 truncate max-w-xs">{p.title}</div>
                        <div className="text-[11px] text-zinc-400">{p.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 uppercase text-[10px] font-bold text-amber-600">
                    {p.category}
                  </td>
                  <td className="p-4 font-mono font-bold text-zinc-950">
                    ${p.price.toFixed(2)}
                  </td>
                  <td className="p-4 font-mono">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.stock > 10
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {p.stock} units
                    </span>
                  </td>
                  <td className="p-4 text-zinc-800 font-semibold">{p.rating || 5.0} / 5</td>
                  <td className="p-4 text-right">
                    <a
                      href={`/product/${p._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 transition inline-block shadow-2xs"
                      title="View live page"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <h3 className="font-extrabold text-zinc-950 text-base">Create New Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Stock Units</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-900 cursor-pointer"
                  >
                    <option value="smartphones">Smartphones</option>
                    <option value="laptops">Laptops</option>
                    <option value="audio">Audio</option>
                    <option value="electronics">Electronics</option>
                    <option value="fashion">Fashion</option>
                    <option value="home">Home & Living</option>
                    <option value="beauty">Beauty</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={formData.brand}
                    placeholder={user?.companyName || 'Brand'}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold cursor-pointer transition shadow-xs"
                >
                  Save & Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessProductsPage;
