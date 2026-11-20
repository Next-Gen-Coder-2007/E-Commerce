import React, { useState, useEffect } from 'react';
import { Plus, Eye, Tag, SlidersHorizontal, Trash2, X, Package } from 'lucide-react';
import { getProductsApi, createProductApi } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import type { Product } from '../../types/product';
import {
  TAXONOMY_CATEGORIES,
  getSubcategoriesForCategory,
} from '../../config/taxonomy';
import { BrutalistButton } from '../../components/BrutalistButton';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#1E1E1E] pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 bg-[#1E1E1E] text-white">
            INVENTORY INDEX
          </span>
          <h2 className="text-2xl sm:text-3xl font-clash font-bold uppercase tracking-tight text-[#1E1E1E] mt-1">
            Products & Stock Inventory
          </h2>
          <p className="text-xs font-mono text-[#444444] uppercase tracking-wider">
            Manage store catalog, dynamic attribute variants, and warehouse unit quantities.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-[#1E1E1E] bg-[#DB4A2B] hover:bg-[#1E1E1E] text-white font-mono font-bold text-xs uppercase shadow-[3px_3px_0px_#1E1E1E] transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="border-2 border-[#1E1E1E] bg-white shadow-[6px_6px_0px_#1E1E1E] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#D9D6D0] text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E] border-b-2 border-[#1E1E1E]">
              <tr>
                <th className="p-4">Product Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4">Rating</th>
                <th className="p-4 text-right">Actions</th>
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
                        <div className="font-clash font-bold text-sm text-[#1E1E1E] truncate max-w-xs uppercase">
                          {p.title}
                        </div>
                        <div className="text-[10px] text-[#444444] font-mono uppercase">
                          BRAND: {p.brand}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className="uppercase text-[10px] font-bold text-[#DB4A2B]">
                        {p.category}
                      </span>
                      {p.subcategory && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#444444]">
                          <Tag className="w-2.5 h-2.5" />
                          {p.subcategory}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-clash font-bold text-sm text-[#1E1E1E]">
                    ${p.price.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${
                        p.stock > 10
                          ? 'border-[#1E1E1E] bg-[#1E1E1E] text-white'
                          : 'border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#DB4A2B]'
                      }`}
                    >
                      {p.stock} UNITS
                    </span>
                  </td>
                  <td className="p-4 text-[#1E1E1E] font-bold">
                    {p.rating ? p.rating.toFixed(1) : '5.0'} / 5.0
                  </td>
                  <td className="p-4 text-right">
                    <a
                      href={`/product/${p._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 border border-[#1E1E1E] bg-white hover:bg-[#1E1E1E] hover:text-white transition inline-block shadow-[2px_2px_0px_#1E1E1E]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1E1E]/80 backdrop-blur-xs">
          <div className="bg-[#E4E2DD] border-2 border-[#1E1E1E] max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-[10px_10px_0px_#1E1E1E] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#1E1E1E]">
              <h3 className="font-clash font-bold text-[#1E1E1E] text-lg uppercase">
                Add New Product Listing
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 border border-[#1E1E1E] hover:bg-[#1E1E1E] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#1E1E1E] font-bold uppercase mb-1">
                  Product Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white border-2 border-[#1E1E1E] px-3.5 py-2 text-[#1E1E1E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1E1E1E] font-bold uppercase mb-1">
                    Valuation ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-white border-2 border-[#1E1E1E] px-3.5 py-2 text-[#1E1E1E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#1E1E1E] font-bold uppercase mb-1">
                    Initial Stock Units
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full bg-white border-2 border-[#1E1E1E] px-3.5 py-2 text-[#1E1E1E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1E1E1E] font-bold uppercase mb-1">
                    Discipline
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full bg-white border-2 border-[#1E1E1E] px-3.5 py-2 text-[#1E1E1E] font-bold focus:outline-none cursor-pointer uppercase"
                  >
                    {TAXONOMY_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#1E1E1E] font-bold uppercase mb-1">
                    Sub-Taxonomy
                  </label>
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => {
                      setSelectedSubcategory(e.target.value);
                      setFormData({ ...formData, subcategory: e.target.value });
                    }}
                    className="w-full bg-white border-2 border-[#1E1E1E] px-3.5 py-2 text-[#1E1E1E] font-bold focus:outline-none cursor-pointer uppercase"
                  >
                    {getSubcategoriesForCategory(selectedCategory).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Flexible Variant Attributes */}
              <div className="p-4 bg-white border-2 border-[#1E1E1E] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-clash font-bold text-[#1E1E1E] uppercase">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#DB4A2B]" />
                    <span>Dynamic Specifications & Variants</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddCustomVariant()}
                    className="px-2.5 py-1 border border-[#1E1E1E] bg-[#D9D6D0] hover:bg-[#1E1E1E] hover:text-white text-[10px] font-bold uppercase transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3 inline mr-1" />
                    <span>+ Variant</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {variantRows.map((row) => (
                    <div key={row.id} className="p-2.5 border border-[#1E1E1E] bg-[#E4E2DD] flex items-center gap-2">
                      <div className="w-1/3">
                        <input
                          type="text"
                          placeholder="e.g. Size, Color"
                          value={row.name}
                          onChange={(e) => handleUpdateVariantRow(row.id, 'name', e.target.value)}
                          className="w-full bg-white border border-[#1E1E1E] px-2 py-1 text-xs text-[#1E1E1E] font-bold focus:outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="e.g. Red, Blue, Black or S, M, L"
                          value={row.value}
                          onChange={(e) => handleUpdateVariantRow(row.id, 'value', e.target.value)}
                          className="w-full bg-white border border-[#1E1E1E] px-2 py-1 text-xs text-[#1E1E1E] focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariantRow(row.id)}
                        className="p-1 border border-[#DB4A2B] text-[#DB4A2B] hover:bg-[#DB4A2B] hover:text-white transition cursor-pointer shrink-0"
                        title="Remove variant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {variantRows.length === 0 && (
                    <div className="text-center py-3 border border-dashed border-zinc-400 text-[#444444] text-[11px]">
                      No dynamic variants defined yet.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[#1E1E1E] font-bold uppercase mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  placeholder={user?.companyName || 'Brand'}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full bg-white border-2 border-[#1E1E1E] px-3.5 py-2 text-[#1E1E1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#1E1E1E] font-bold uppercase mb-1">
                  Image Graphic URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full bg-white border-2 border-[#1E1E1E] px-3.5 py-2 text-[#1E1E1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#1E1E1E] font-bold uppercase mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border-2 border-[#1E1E1E] px-3.5 py-2 text-[#1E1E1E] font-satoshi focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-[#1E1E1E]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border-2 border-[#1E1E1E] bg-white text-[#1E1E1E] font-bold uppercase cursor-pointer hover:bg-[#D9D6D0] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 border-2 border-[#1E1E1E] bg-[#1E1E1E] hover:bg-[#DB4A2B] text-white font-bold uppercase cursor-pointer transition shadow-[3px_3px_0px_#1E1E1E]"
                >
                  Publish Product
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
