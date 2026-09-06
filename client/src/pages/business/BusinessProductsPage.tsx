import React, { useState, useEffect } from 'react';
import { Plus, Eye, Tag, SlidersHorizontal, Trash2 } from 'lucide-react';
import { getProductsApi, createProductApi } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import type { Product } from '../../types/product';
import {
  TAXONOMY_CATEGORIES,
  getSubcategoriesForCategory,
} from '../../config/taxonomy';

interface VariantRow {
  id: string;
  name: string;
  value: string;
}

export const BusinessProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('fashion');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'fashion',
    subcategory: '',
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

  // Update subcategories and suggested variants when category changes
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    const subcats = getSubcategoriesForCategory(catId);
    const defaultSubcat = subcats.length > 0 ? subcats[0] : '';
    setSelectedSubcategory(defaultSubcat);

    setFormData((prev) => ({
      ...prev,
      category: catId,
      subcategory: defaultSubcat,
    }));
  };

  const handleAddCustomVariant = (name = '') => {
    setVariantRows((prev) => [
      ...prev,
      {
        id: `var-${Date.now()}-${Math.random()}`,
        name,
        value: '',
      },
    ]);
  };

  const handleRemoveVariantRow = (id: string) => {
    setVariantRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateVariantRow = (id: string, field: 'name' | 'value', val: string) => {
    setVariantRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleOpenAddModal = () => {
    const initialCategory = 'fashion';
    setSelectedCategory(initialCategory);
    const subcats = getSubcategoriesForCategory(initialCategory);
    const defaultSub = subcats[0] || '';
    setSelectedSubcategory(defaultSub);
    setVariantRows([]);

    setFormData({
      title: '',
      description: '',
      price: '',
      category: initialCategory,
      subcategory: defaultSub,
      stock: '25',
      image: '',
      brand: user?.companyName || '',
    });
    setShowAddModal(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const attributesPayload: Record<string, string> = {};
      variantRows.forEach((r) => {
        const trimmedName = r.name.trim();
        const trimmedVal = r.value.trim();
        if (trimmedName && trimmedVal) {
          attributesPayload[trimmedName] = trimmedVal;
        }
      });

      // Build specifications array from attributes
      const specs = Object.entries(attributesPayload).map(([key, value]) => ({
        key,
        value: value.trim(),
      }));

      await createProductApi({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        subcategory: formData.subcategory || selectedSubcategory,
        attributes: attributesPayload,
        specifications: specs,
        stock: parseInt(formData.stock, 10),
        image: formData.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        brand: formData.brand || user?.companyName || 'My Brand',
      });
      setShowAddModal(false);
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
          onClick={handleOpenAddModal}
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
                        src={p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                        alt={p.title}
                        className="w-10 h-10 rounded-xl object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-900 truncate max-w-xs">{p.title}</div>
                        <div className="text-[11px] text-zinc-400">{p.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className="uppercase text-[10px] font-bold text-indigo-600">
                        {p.category}
                      </span>
                      {p.subcategory && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                          <Tag className="w-2.5 h-2.5 text-zinc-400" />
                          {p.subcategory}
                        </span>
                      )}
                    </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-900 cursor-pointer font-medium"
                  >
                    {TAXONOMY_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Subcategory</label>
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => {
                      setSelectedSubcategory(e.target.value);
                      setFormData({ ...formData, subcategory: e.target.value });
                    }}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-900 cursor-pointer font-medium"
                  >
                    {getSubcategoriesForCategory(selectedCategory).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Merchant Custom & Flexible Variant Attributes */}
              <div className="p-4 bg-zinc-50/90 border border-zinc-200 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Product Variants & Specifications</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddCustomVariant()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Custom Variant</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Add whatever variants or options you need for this product (e.g. Size, Color, Edition, Storage, Material). Separate multiple options with commas (e.g. <em>Red, Blue, Green</em> or <em>S, M, L</em>).
                </p>

                {/* Dynamic List of Variant Rows */}
                <div className="space-y-3">
                  {variantRows.map((row) => (
                    <div key={row.id} className="bg-white border border-zinc-200 rounded-xl p-3 space-y-2.5 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <div className="w-1/3">
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                            Variant Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Size, Color, Edition"
                            value={row.name}
                            onChange={(e) => handleUpdateVariantRow(row.id, 'name', e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 font-bold focus:outline-none focus:border-zinc-900"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                            Options / Values (comma-separated)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Red, Blue, Green or 128GB, 256GB"
                            value={row.value}
                            onChange={(e) => handleUpdateVariantRow(row.id, 'value', e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(row.id)}
                          className="p-2 mt-5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                          title="Remove variant"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {variantRows.length === 0 && (
                    <div className="text-center py-4 bg-white border border-dashed border-zinc-200 rounded-xl">
                      <p className="text-xs text-zinc-500">No variants added yet.</p>
                      <button
                        type="button"
                        onClick={() => handleAddCustomVariant()}
                        className="mt-2 text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                      >
                        + Add a variant or specification
                      </button>
                    </div>
                  )}
                </div>
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
