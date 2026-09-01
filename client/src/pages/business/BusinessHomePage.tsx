import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BusinessNavbar } from '../../components/business/BusinessNavbar';
import {
  Building2,
  Package,
  Boxes,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  PlusCircle,
  Edit2,
  Trash2,
  Search,
  X,
  CheckCircle2,
  TrendingUp,
  Copy,
  Upload,
  Loader2,
  Cloud,
  Truck,
  Save,
  Landmark,
  MapPin,
} from 'lucide-react';
import {
  getMyCompanyProductsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  getCompanyStatsApi,
  uploadProductImageApi,
} from '../../services/productService';
import {
  getCompanyOrdersApi,
  updateOrderStatusApi,
} from '../../services/orderService';
import type { Product, CompanyStats } from '../../types/product';
import type { Order, CompanyOrderStats, OrderStatus } from '../../types/order';

export const BusinessHomePage: React.FC = () => {
  const { user, loading: authLoading, logout, updateBusinessDetails } = useAuth();

  const [activeTab, setActiveTab] = useState<'products' | 'inventory' | 'orders' | 'profile'>('products');

  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<CompanyStats>({
    totalProducts: 0,
    totalUnits: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  });

  // Orders State
  const [merchantOrders, setMerchantOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState<CompanyOrderStats | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('all');
  const [ordersSearch, setOrdersSearch] = useState('');
  const [selectedFulfillmentOrder, setSelectedFulfillmentOrder] = useState<Order | null>(null);
  const [fulfillmentForm, setFulfillmentForm] = useState<{
    status: OrderStatus;
    carrier: string;
    trackingNumber: string;
    estimatedDelivery: string;
    shippingNotes: string;
    note: string;
  }>({
    status: 'processing',
    carrier: 'NovaExpress',
    trackingNumber: '',
    estimatedDelivery: '',
    shippingNotes: '',
    note: '',
  });
  const [fulfillmentSubmitting, setFulfillmentSubmitting] = useState(false);

  // Business Profile & Payout State
  const [businessForm, setBusinessForm] = useState({
    companyName: user?.companyName || '',
    taxId: user?.businessDetails?.taxId || '',
    supportEmail: user?.businessDetails?.supportEmail || user?.email || '',
    supportPhone: user?.businessDetails?.supportPhone || user?.phone || '',
    website: user?.businessDetails?.website || '',
    storeDescription: user?.businessDetails?.storeDescription || '',
    addressLine1: user?.businessDetails?.businessAddress?.addressLine1 || '',
    addressLine2: user?.businessDetails?.businessAddress?.addressLine2 || '',
    city: user?.businessDetails?.businessAddress?.city || '',
    state: user?.businessDetails?.businessAddress?.state || '',
    postalCode: user?.businessDetails?.businessAddress?.postalCode || '',
    country: user?.businessDetails?.businessAddress?.country || 'United States',
    accountHolderName: user?.businessDetails?.bankDetails?.accountHolderName || '',
    bankName: user?.businessDetails?.bankDetails?.bankName || '',
    accountNumber: user?.businessDetails?.bankDetails?.accountNumber || '',
    routingNumber: user?.businessDetails?.bankDetails?.routingNumber || '',
    currency: user?.businessDetails?.bankDetails?.currency || 'USD',
  });

  const [savingBusiness, setSavingBusiness] = useState(false);
  const [businessSuccessMsg, setBusinessSuccessMsg] = useState<string | null>(null);
  const [businessErrorMsg, setBusinessErrorMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'electronics',
    stock: '',
    image: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!user || (user.role !== 'company' && user.role !== 'admin')) return;

    setLoading(true);
    setError(null);
    try {
      const [prodRes, statsRes] = await Promise.all([
        getMyCompanyProductsApi({ search: search.trim() || undefined }),
        getCompanyStatsApi(),
      ]);
      setProducts(prodRes.products || []);
      if (statsRes.stats) {
        setStats(statsRes.stats);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load merchant inventory');
    } finally {
      setLoading(false);
    }
  }, [user, search]);

  const fetchOrders = useCallback(async () => {
    if (!user || (user.role !== 'company' && user.role !== 'admin')) return;
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const res = await getCompanyOrdersApi({
        status: ordersStatusFilter !== 'all' ? ordersStatusFilter : undefined,
        search: ordersSearch.trim() || undefined,
      });
      if (res.success) {
        setMerchantOrders(res.orders || []);
        if (res.stats) {
          setOrderStats(res.stats);
        }
      }
    } catch (err: any) {
      setOrdersError(err.message || 'Failed to retrieve merchant orders');
    } finally {
      setOrdersLoading(false);
    }
  }, [user, ordersStatusFilter, ordersSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]);

  useEffect(() => {
    if (user) {
      setBusinessForm({
        companyName: user.companyName || '',
        taxId: user.businessDetails?.taxId || '',
        supportEmail: user.businessDetails?.supportEmail || user.email || '',
        supportPhone: user.businessDetails?.supportPhone || user.phone || '',
        website: user.businessDetails?.website || '',
        storeDescription: user.businessDetails?.storeDescription || '',
        addressLine1: user.businessDetails?.businessAddress?.addressLine1 || '',
        addressLine2: user.businessDetails?.businessAddress?.addressLine2 || '',
        city: user.businessDetails?.businessAddress?.city || '',
        state: user.businessDetails?.businessAddress?.state || '',
        postalCode: user.businessDetails?.businessAddress?.postalCode || '',
        country: user.businessDetails?.businessAddress?.country || 'United States',
        accountHolderName: user.businessDetails?.bankDetails?.accountHolderName || '',
        bankName: user.businessDetails?.bankDetails?.bankName || '',
        accountNumber: user.businessDetails?.bankDetails?.accountNumber || '',
        routingNumber: user.businessDetails?.bankDetails?.routingNumber || '',
        currency: user.businessDetails?.bankDetails?.currency || 'USD',
      });
    }
  }, [user]);

  const handleSaveBusinessProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBusiness(true);
    setBusinessSuccessMsg(null);
    setBusinessErrorMsg(null);
    try {
      const ok = await updateBusinessDetails({
        companyName: businessForm.companyName,
        taxId: businessForm.taxId,
        supportEmail: businessForm.supportEmail,
        supportPhone: businessForm.supportPhone,
        website: businessForm.website,
        storeDescription: businessForm.storeDescription,
        businessAddress: {
          addressLine1: businessForm.addressLine1,
          addressLine2: businessForm.addressLine2,
          city: businessForm.city,
          state: businessForm.state,
          postalCode: businessForm.postalCode,
          country: businessForm.country,
        },
        bankDetails: {
          accountHolderName: businessForm.accountHolderName,
          bankName: businessForm.bankName,
          accountNumber: businessForm.accountNumber,
          routingNumber: businessForm.routingNumber,
          currency: businessForm.currency,
        },
      });

      if (ok) {
        setBusinessSuccessMsg('Business profile and payout details saved successfully!');
        setTimeout(() => setBusinessSuccessMsg(null), 4000);
      } else {
        throw new Error('Failed to update business details');
      }
    } catch (err: any) {
      setBusinessErrorMsg(err.message || 'Failed to save business profile');
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleOpenFulfillment = (order: Order) => {
    setSelectedFulfillmentOrder(order);
    setFulfillmentForm({
      status: order.orderStatus,
      carrier: order.fulfillment?.carrier || 'NovaExpress',
      trackingNumber: order.fulfillment?.trackingNumber || '',
      estimatedDelivery: order.fulfillment?.estimatedDelivery
        ? new Date(order.fulfillment.estimatedDelivery).toISOString().split('T')[0]
        : '',
      shippingNotes: order.fulfillment?.shippingNotes || '',
      note: '',
    });
  };

  const handleSaveFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFulfillmentOrder) return;
    try {
      setFulfillmentSubmitting(true);
      await updateOrderStatusApi(selectedFulfillmentOrder._id, fulfillmentForm);
      setSelectedFulfillmentOrder(null);
      await fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setFulfillmentSubmitting(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      category: 'electronics',
      stock: '',
      image: '',
    });
    setModalError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      title: prod.title,
      description: prod.description,
      price: prod.price.toString(),
      category: prod.category,
      stock: prod.stock.toString(),
      image: prod.image,
    });
    setModalError(null);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setModalError('Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 500 * 1024) {
      setModalError('Image size exceeds 500KB limit. Please choose a smaller image.');
      return;
    }

    setUploadingImage(true);
    setModalError(null);

    try {
      const result = await uploadProductImageApi(file);
      if (result.url) {
        setFormData((prev) => ({ ...prev, image: result.url }));
      }
    } catch (err: any) {
      setModalError(err.response?.data?.message || err.message || 'Failed to upload image to Cloudinary');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.price || !formData.stock) {
      setModalError('Please fill out all required fields');
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      if (editingProduct) {
        await updateProductApi(editingProduct._id, {
          title: formData.title,
          description: formData.description,
          price: Number(formData.price),
          category: formData.category,
          stock: Number(formData.stock),
          image: formData.image || undefined,
        });
        setEditingProduct(null);
      } else {
        await createProductApi({
          title: formData.title,
          description: formData.description,
          price: Number(formData.price),
          category: formData.category,
          stock: Number(formData.stock),
          image: formData.image || undefined,
        });
        setShowAddModal(false);
      }
      await fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save product listing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProductId) return;
    setSubmitting(true);
    try {
      await deleteProductApi(deletingProductId);
      setDeletingProductId(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickRestock = async (prod: Product, addAmount: number) => {
    try {
      await updateProductApi(prod._id, {
        stock: prod.stock + addAmount,
      });
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Restock failed');
    }
  };

  const handleCopyUuid = () => {
    if (user?._id) {
      navigator.clipboard.writeText(user._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center space-y-3 text-zinc-900">
        <div className="w-8 h-8 border-3 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-zinc-500 font-mono">
          Authenticating Merchant Session...
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50/60 text-zinc-900 flex flex-col">
        <BusinessNavbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 text-zinc-950 border border-zinc-200 flex items-center justify-center mx-auto shadow-xs">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
            NovaCommerce Seller Central
          </h1>
          <p className="text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
            Enterprise Merchant Studio for managing product catalogs, warehouse stock, and microservices telemetry.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/business/login"
              className="px-6 py-3 rounded-xl text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 transition-transform active:scale-[0.98] shadow-xs"
            >
              Merchant Sign In
            </Link>
            <Link
              to="/business/register"
              className="px-6 py-3 rounded-xl text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 transition-colors shadow-2xs"
            >
              Register Company
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (user.role !== 'company' && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-zinc-50/60 text-zinc-900 flex flex-col">
        <BusinessNavbar />
        <main className="flex-1 max-w-lg mx-auto px-4 py-20 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-950">Company Account Required</h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            You are signed in with personal customer account <strong className="text-zinc-900">{user.email}</strong>. Seller Central is reserved for registered business entities.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/business/register"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 transition-colors"
            >
              Register Business Store
            </Link>
            <button
              type="button"
              onClick={logout}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-950 bg-white border border-zinc-200 shadow-2xs cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </main>
      </div>
    );
  }

  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 5);
  const outOfStockProducts = products.filter((p) => p.stock === 0);

  return (
    <div className="min-h-screen bg-zinc-50/60 text-zinc-900 flex flex-col font-sans select-none">
      <BusinessNavbar onOpenAddModal={handleOpenAdd} />

      <div className="bg-white border-b border-zinc-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none py-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'products'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Products & Catalog</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Warehouse Inventory</span>
            {stats.lowStock + stats.outOfStock > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                {stats.lowStock + stats.outOfStock} alerts
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Orders & Sales</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Store Profile & APIs</span>
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Active Catalog</span>
              <Package className="w-4 h-4 text-zinc-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-950">
              {stats.totalProducts}
            </div>
            <div className="text-[11px] text-zinc-500">Products live on marketplace</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Warehouse Stock</span>
              <Boxes className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-950">
              {stats.totalUnits}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium">Total available units</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Stock Alerts</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-950">
              {stats.lowStock + stats.outOfStock}
            </div>
            <div className="text-[11px] text-amber-600 font-medium">
              {stats.outOfStock} out of stock, {stats.lowStock} low
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Inventory Value</span>
              <DollarSign className="w-4 h-4 text-zinc-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-950">
              ${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-zinc-500">Total catalog inventory valuation</div>
          </div>
        </div>

        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
                  Merchant Catalog ({products.length})
                </h2>
                <p className="text-xs text-zinc-500">
                  Manage product listings, pricing, and marketplace visibility.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Filter products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 m-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {error}
              </div>
            )}

            {loading ? (
              <div className="p-12 text-center">
                <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-zinc-500 mt-2">Loading merchant catalog...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Package className="w-10 h-10 text-zinc-300 mx-auto" />
                <p className="text-sm font-semibold text-zinc-900">
                  No products in your catalog
                </p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Click &quot;Add Product&quot; to publish your first merchant product listing.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create First Product</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Product Listing</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Price</th>
                      <th className="px-5 py-3">Stock Units</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 text-zinc-800">
                    {products.map((prod) => (
                      <tr key={prod._id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.image}
                              alt={prod.title}
                              className="w-10 h-10 rounded-lg object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-zinc-950 max-w-xs truncate">
                                {prod.title}
                              </div>
                              <div className="text-[11px] text-zinc-500 line-clamp-1 max-w-xs">
                                {prod.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 capitalize font-medium text-zinc-600">
                          {prod.category}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-zinc-950">
                          ${prod.price.toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              prod.stock === 0
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : prod.stock <= 5
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {prod.stock} units
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Published</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(prod)}
                              className="p-1.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Listing"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingProductId(prod._id)}
                              className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                              title="Delete Listing"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-4 shadow-2xs">
              <div>
                <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Low Stock & Urgent Replenishment Alerts ({lowStockProducts.length})</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Products with 5 or fewer units remaining in warehouse inventory.
                </p>
              </div>

              {lowStockProducts.length === 0 ? (
                <div className="p-6 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>All active inventory items maintain healthy stock levels (&gt; 5 units).</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lowStockProducts.map((item) => (
                    <div
                      key={item._id}
                      className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-12 h-12 rounded-lg object-cover border border-zinc-200 bg-white"
                        />
                        <div>
                          <div className="font-bold text-zinc-950 text-xs truncate max-w-[200px]">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-amber-700 font-semibold">
                            Only {item.stock} units remaining
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuickRestock(item, 25)}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-semibold cursor-pointer transition-colors"
                        >
                          +25 Units
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickRestock(item, 50)}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-[11px] font-semibold cursor-pointer transition-colors"
                        >
                          +50
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-4 shadow-2xs">
              <div>
                <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                  <X className="w-4 h-4 text-rose-500" />
                  <span>Out of Stock Monitor ({outOfStockProducts.length})</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Products with 0 units available. These items display as Out of Stock on the marketplace.
                </p>
              </div>

              {outOfStockProducts.length === 0 ? (
                <div className="p-6 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-500 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No products are currently out of stock.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {outOfStockProducts.map((item) => (
                    <div
                      key={item._id}
                      className="p-4 rounded-xl bg-zinc-50 border border-rose-200 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-12 h-12 rounded-lg object-cover border border-zinc-200 opacity-60 bg-white"
                        />
                        <div>
                          <div className="font-bold text-zinc-950 text-xs truncate max-w-[200px]">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-rose-700 font-semibold">
                            0 Units (Depleted)
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickRestock(item, 50)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        Restock +50
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Merchant KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Merchant Revenue
                </span>
                <div className="text-2xl font-black font-mono text-zinc-950">
                  ${orderStats?.totalRevenue?.toFixed(2) || '0.00'}
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold">
                  Direct seller payout balance
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Total Orders
                </span>
                <div className="text-2xl font-black font-mono text-zinc-950">
                  {orderStats?.totalOrders || 0}
                </div>
                <span className="text-[11px] text-zinc-500 font-semibold">
                  Orders containing your catalog items
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Units Sold
                </span>
                <div className="text-2xl font-black font-mono text-zinc-950">
                  {orderStats?.unitsSold || 0}
                </div>
                <span className="text-[11px] text-indigo-600 font-semibold">
                  Individual products dispatched
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Pending Fulfillment
                </span>
                <div className="text-2xl font-black font-mono text-amber-600">
                  {orderStats?.pendingFulfillment || 0}
                </div>
                <span className="text-[11px] text-zinc-500 font-semibold">
                  Requires preparation / dispatch
                </span>
              </div>
            </div>

            {/* Orders Table Container */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs divide-y divide-zinc-200/80">
              {/* Filter and Search Bar */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                  {[
                    { id: 'all', label: 'All Orders' },
                    { id: 'placed', label: 'Placed' },
                    { id: 'confirmed', label: 'Confirmed' },
                    { id: 'processing', label: 'Processing' },
                    { id: 'shipped', label: 'Shipped' },
                    { id: 'delivered', label: 'Delivered' },
                    { id: 'cancelled', label: 'Cancelled' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setOrdersStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        ordersStatusFilter === tab.id
                          ? 'bg-zinc-950 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/70'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                    placeholder="Search by order #, customer..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900"
                  />
                </div>
              </div>

              {/* Order List */}
              {ordersLoading ? (
                <div className="p-12 text-center text-xs text-zinc-500 font-mono flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Loading merchant orders telemetry...</span>
                </div>
              ) : ordersError ? (
                <div className="p-8 text-center text-xs text-rose-600 font-medium space-y-2">
                  <AlertCircle className="w-6 h-6 mx-auto text-rose-500" />
                  <div>{ordersError}</div>
                  <button
                    type="button"
                    onClick={() => fetchOrders()}
                    className="px-3 py-1 bg-zinc-950 text-white rounded-lg text-xs"
                  >
                    Retry
                  </button>
                </div>
              ) : merchantOrders.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400">
                    <Package className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-950">No Merchant Orders Found</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    When customers purchase your listed products, new orders and shipping assignments will populate here in real-time.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {merchantOrders.map((ord) => {
                    const ordDate = new Date(ord.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    // Calculate items belonging to this merchant
                    const myItems = ord.orderItems.filter(
                      (it) =>
                        (it.companyId && it.companyId.toString() === user?._id?.toString()) ||
                        (it.companyName && user?.companyName && it.companyName.toLowerCase() === user.companyName.toLowerCase())
                    );

                    const itemsToShow = myItems.length > 0 ? myItems : ord.orderItems;
                    const merchantItemsTotal = itemsToShow.reduce((s, i) => s + i.price * i.quantity, 0);

                    return (
                      <div
                        key={ord._id}
                        className="p-5 sm:p-6 space-y-4 hover:bg-zinc-50/50 transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-black text-zinc-950 bg-zinc-100 px-2 py-1 rounded-lg border border-zinc-200">
                              {ord.orderNumber}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {ordDate}
                            </span>
                            <span className="text-xs text-zinc-400">•</span>
                            <span className="text-xs text-zinc-700 font-medium">
                              Customer: <strong className="text-zinc-900">{ord.customer.name}</strong> ({ord.customer.email})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize border ${
                                ord.orderStatus === 'delivered'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : ord.orderStatus === 'shipped'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : ord.orderStatus === 'cancelled'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}
                            >
                              {ord.orderStatus.replace(/_/g, ' ')}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleOpenFulfillment(ord)}
                              className="px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                            >
                              Manage Fulfillment
                            </button>
                          </div>
                        </div>

                        {/* Items preview */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                          <div className="flex flex-wrap items-center gap-3">
                            {itemsToShow.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-zinc-200 shadow-2xs max-w-[200px]"
                              >
                                <img
                                  src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'}
                                  alt={item.title}
                                  className="w-8 h-8 rounded-lg object-cover border border-zinc-100"
                                />
                                <div className="min-w-0">
                                  <div className="text-[11px] font-bold text-zinc-900 truncate">
                                    {item.title}
                                  </div>
                                  <div className="text-[10px] text-zinc-500 font-mono">
                                    ${item.price.toFixed(2)} × {item.quantity}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                              Merchant Share
                            </span>
                            <span className="text-sm font-black font-mono text-zinc-950">
                              ${merchantItemsTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Fulfillment Info snippet */}
                        {ord.fulfillment?.trackingNumber && (
                          <div className="text-[11px] text-zinc-500 flex items-center gap-2 pt-1 border-t border-zinc-100">
                            <Truck className="w-3.5 h-3.5 text-zinc-700" />
                            <span>Carrier: <strong className="text-zinc-900">{ord.fulfillment.carrier}</strong></span>
                            <span>•</span>
                            <span>Tracking: <strong className="font-mono text-zinc-900">{ord.fulfillment.trackingNumber}</strong></span>
                            {ord.fulfillment.shippingNotes && (
                              <>
                                <span>•</span>
                                <span className="italic">{ord.fulfillment.shippingNotes}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Merchant Fulfillment Modal */}
            {selectedFulfillmentOrder && (
              <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl border border-zinc-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-zinc-950">
                          Update Order #{selectedFulfillmentOrder.orderNumber}
                        </h3>
                        <span className="text-[11px] text-zinc-500">
                          Customer: {selectedFulfillmentOrder.customer.name}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFulfillmentOrder(null)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveFulfillment} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase">
                        Order Lifecycle Status
                      </label>
                      <select
                        value={fulfillmentForm.status}
                        onChange={(e) =>
                          setFulfillmentForm((prev) => ({
                            ...prev,
                            status: e.target.value as OrderStatus,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900"
                      >
                        <option value="placed">Placed (Order Received)</option>
                        <option value="confirmed">Confirmed (Payment Verified)</option>
                        <option value="processing">Processing (Packing at Warehouse)</option>
                        <option value="shipped">Shipped (Dispatched to Carrier)</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered (Completed)</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-zinc-700 uppercase">
                          Shipping Carrier
                        </label>
                        <input
                          type="text"
                          value={fulfillmentForm.carrier}
                          onChange={(e) =>
                            setFulfillmentForm((prev) => ({
                              ...prev,
                              carrier: e.target.value,
                            }))
                          }
                          placeholder="e.g. FedEx, NovaExpress"
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-zinc-700 uppercase">
                          Tracking Number
                        </label>
                        <input
                          type="text"
                          value={fulfillmentForm.trackingNumber}
                          onChange={(e) =>
                            setFulfillmentForm((prev) => ({
                              ...prev,
                              trackingNumber: e.target.value,
                            }))
                          }
                          placeholder="NVX-12345678"
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-mono text-zinc-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase">
                        Estimated Delivery Date
                      </label>
                      <input
                        type="date"
                        value={fulfillmentForm.estimatedDelivery}
                        onChange={(e) =>
                          setFulfillmentForm((prev) => ({
                            ...prev,
                            estimatedDelivery: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase">
                        Fulfillment Note for Customer
                      </label>
                      <input
                        type="text"
                        value={fulfillmentForm.shippingNotes}
                        onChange={(e) =>
                          setFulfillmentForm((prev) => ({
                            ...prev,
                            shippingNotes: e.target.value,
                          }))
                        }
                        placeholder="Package is sealed and out for pickup"
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={() => setSelectedFulfillmentOrder(null)}
                        className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={fulfillmentSubmitting}
                        className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        {fulfillmentSubmitting ? 'Saving...' : 'Update Status'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Top Identity Cards */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 divide-y divide-zinc-100 shadow-2xs">
              <div className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-zinc-950 uppercase tracking-wider">
                      Enterprise Merchant Profile
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Verified organization identity & corporate settings stored in Auth Service.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Business Account
                  </span>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Company Legal Entity
                  </span>
                  <div className="text-xs font-black text-zinc-950 truncate">
                    {user.companyName || 'Registered Enterprise'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Primary Contact
                  </span>
                  <div className="text-xs font-black text-zinc-950 truncate">{user.name}</div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Corporate Email
                  </span>
                  <div className="text-xs font-bold text-zinc-900 truncate">{user.email}</div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Merchant ID
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUuid}
                      className="text-zinc-400 hover:text-zinc-950 cursor-pointer"
                      title="Copy UUID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs font-mono text-zinc-700 truncate">
                    {copied ? 'Copied!' : user._id}
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Business & Payout Form */}
            <form onSubmit={handleSaveBusinessProfile} className="space-y-6">
              {businessSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{businessSuccessMsg}</span>
                </div>
              )}

              {businessErrorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{businessErrorMsg}</span>
                </div>
              )}

              {/* Section 1: Business Profile & Contact Info */}
              <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-zinc-950">
                        Company & Store Information
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Public storefront identity, tax registration, and support contact
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Company Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={businessForm.companyName}
                      onChange={(e) =>
                        setBusinessForm((prev) => ({ ...prev, companyName: e.target.value }))
                      }
                      placeholder="e.g. Apex Audio Labs"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Tax ID / EIN / VAT Number
                    </label>
                    <input
                      type="text"
                      value={businessForm.taxId}
                      onChange={(e) =>
                        setBusinessForm((prev) => ({ ...prev, taxId: e.target.value }))
                      }
                      placeholder="e.g. XX-XXXXXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs font-mono text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Customer Support Email
                    </label>
                    <input
                      type="email"
                      value={businessForm.supportEmail}
                      onChange={(e) =>
                        setBusinessForm((prev) => ({ ...prev, supportEmail: e.target.value }))
                      }
                      placeholder="support@yourcompany.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Support Phone Number
                    </label>
                    <input
                      type="tel"
                      value={businessForm.supportPhone}
                      onChange={(e) =>
                        setBusinessForm((prev) => ({ ...prev, supportPhone: e.target.value }))
                      }
                      placeholder="+1 (800) 555-0199"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Store Website URL
                    </label>
                    <input
                      type="url"
                      value={businessForm.website}
                      onChange={(e) =>
                        setBusinessForm((prev) => ({ ...prev, website: e.target.value }))
                      }
                      placeholder="https://www.yourbrand.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Store Description / Brand Bio
                    </label>
                    <textarea
                      rows={2}
                      value={businessForm.storeDescription}
                      onChange={(e) =>
                        setBusinessForm((prev) => ({
                          ...prev,
                          storeDescription: e.target.value,
                        }))
                      }
                      placeholder="Crafting premium high-fidelity audio equipment and studio accessories..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Physical / Registered Business Address */}
              <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-zinc-950">
                        Registered Business & Warehouse Address
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Official corporate address used for returns and invoices
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={businessForm.addressLine1}
                      onChange={(e) =>
                        setBusinessForm((prev) => ({ ...prev, addressLine1: e.target.value }))
                      }
                      placeholder="100 Innovation Way"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Suite / Building / Unit
                    </label>
                    <input
                      type="text"
                      value={businessForm.addressLine2}
                      onChange={(e) =>
                        setBusinessForm((prev) => ({ ...prev, addressLine2: e.target.value }))
                      }
                      placeholder="Suite 400"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      City
                    </label>
                    <input
                      type="text"
                      value={businessForm.city}
                      onChange={(e) =>
                        setBusinessForm((prev) => ({ ...prev, city: e.target.value }))
                      }
                      placeholder="San Jose"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      State / Province
                    </label>
                    <input
                      type="text"
                      value={businessForm.state}
                      onChange={(e) =>
                        setBusinessForm((prev) => ({ ...prev, state: e.target.value }))
                      }
                      placeholder="CA"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      ZIP / Postal Code
                    </label>
                    <input
                      type="text"
                      value={businessForm.postalCode}
                      onChange={(e) =>
                        setBusinessForm((prev) => ({ ...prev, postalCode: e.target.value }))
                      }
                      placeholder="95134"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Banking & Payout Settings */}
              <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-zinc-950">
                        Merchant Payout & Bank Account
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Automated merchant disbursements and settlement details
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">
                    Encrypted Gateway Vault
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={businessForm.accountHolderName}
                      onChange={(e) =>
                        setBusinessForm((prev) => ({
                          ...prev,
                          accountHolderName: e.target.value,
                        }))
                      }
                      placeholder="Apex Audio Labs LLC"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={businessForm.bankName}
                      onChange={(e) =>
                        setBusinessForm((prev) => ({ ...prev, bankName: e.target.value }))
                      }
                      placeholder="Silicon Valley Bank / Chase"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Account / IBAN Number
                    </label>
                    <input
                      type="text"
                      value={businessForm.accountNumber}
                      onChange={(e) =>
                        setBusinessForm((prev) => ({
                          ...prev,
                          accountNumber: e.target.value,
                        }))
                      }
                      placeholder="••••••••4921"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs font-mono text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Routing / SWIFT / BIC Code
                    </label>
                    <input
                      type="text"
                      value={businessForm.routingNumber}
                      onChange={(e) =>
                        setBusinessForm((prev) => ({
                          ...prev,
                          routingNumber: e.target.value,
                        }))
                      }
                      placeholder="021000021"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs font-mono text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Disbursement Currency
                    </label>
                    <select
                      value={businessForm.currency}
                      onChange={(e) =>
                        setBusinessForm((prev) => ({ ...prev, currency: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                    >
                      <option value="USD">USD ($ - US Dollar)</option>
                      <option value="EUR">EUR (€ - Euro)</option>
                      <option value="GBP">GBP (£ - British Pound)</option>
                      <option value="CAD">CAD ($ - Canadian Dollar)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingBusiness}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {savingBusiness ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Business Account...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-emerald-400" />
                      <span>Save Business Details & Payout Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {(showAddModal || editingProduct) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
        >
          <div
            className="bg-white border border-zinc-200 max-w-lg w-full p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-950">
                  {editingProduct ? 'Edit Product Listing' : 'Add New Product Listing'}
                </h3>
                <p className="text-xs text-zinc-500">
                  {editingProduct
                    ? 'Modify catalog details, pricing, and Cloudinary media'
                    : 'Publish an item directly to the live marketplace'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-950 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                  Product Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                  Description & Specifications
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide comprehensive details for shoppers..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="299.99"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    Stock Units
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="50"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                  Category Department
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900 capitalize cursor-pointer"
                >
                  <option value="electronics">Electronics</option>
                  <option value="fashion">Fashion & Apparel</option>
                  <option value="home">Home & Living</option>
                  <option value="beauty">Beauty & Skincare</option>
                  <option value="sports">Sports & Outdoors</option>
                  <option value="books">Books & Media</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    Product Image (Cloudinary)
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                    <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Cloudinary Storage</span>
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileUpload}
                  accept="image/png, image/jpeg, image/webp, image/jpg"
                  className="hidden"
                />

                {!formData.image ? (
                  <div className="space-y-2.5">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          const fakeEvent = {
                            target: { files: [file] },
                          } as any;
                          handleImageFileUpload(fakeEvent);
                        }
                      }}
                      className="group border-2 border-dashed border-zinc-200 hover:border-zinc-950 rounded-2xl p-6 text-center bg-zinc-50/60 hover:bg-zinc-100/60 transition-all cursor-pointer space-y-2"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 shadow-2xs flex items-center justify-center mx-auto text-zinc-600 group-hover:scale-105 transition-transform">
                        {uploadingImage ? (
                          <Loader2 className="w-5 h-5 animate-spin text-zinc-950" />
                        ) : (
                          <Upload className="w-5 h-5 text-zinc-700" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-900">
                          {uploadingImage
                            ? 'Uploading image to Cloudinary...'
                            : 'Click to upload or drag & drop'}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          PNG, JPG, WEBP up to 500KB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-zinc-200" />
                      <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">or direct web link</span>
                      <div className="flex-1 h-px bg-zinc-200" />
                    </div>

                    <input
                      type="url"
                      placeholder="Paste direct image URL (https://...)"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative aspect-video rounded-2xl bg-zinc-100 overflow-hidden border border-zinc-200 group">
                      <img
                        src={formData.image}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-zinc-950/80 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Image Attached
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-zinc-950 text-[11px] font-bold shadow-xs cursor-pointer"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, image: '' })}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-zinc-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-950 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingProductId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setDeletingProductId(null)}
        >
          <div
            className="bg-white border border-zinc-200 max-w-sm w-full p-6 rounded-3xl shadow-2xl space-y-4 text-center text-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-950">
                Delete this listing?
              </h3>
              <p className="text-xs text-zinc-500">
                This item will be permanently removed from your merchant store and marketplace catalog.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProductId(null)}
                className="w-full px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-950 bg-zinc-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={submitting}
                className="w-full px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
