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
  Zap,
  Sparkles,
  Percent,
  Store,
  Flame,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Star,
  Plus,
  Sliders,
  MessageSquare,
  Ticket,
  Tag,
  Gift,
  Check,
} from 'lucide-react';
import {
  getMyCompanyProductsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  getCompanyStatsApi,
  uploadProductImageApi,
  getStorefrontSettingsApi,
  updateStorefrontSettingsApi,
  applyBulkDiscountApi,
} from '../../services/productService';
import {
  getCompanyOrdersApi,
  updateOrderStatusApi,
} from '../../services/orderService';
import { getCompanyReviewsApi } from '../../services/reviewService';
import {
  getMyCompanyCouponsApi,
  createCouponApi,
  updateCouponApi,
  toggleCouponApi,
  deleteCouponApi,
} from '../../services/couponService';
import { ReviewCard } from '../../components/reviews/ReviewCard';
import type { Product, CompanyStats } from '../../types/product';
import type { Order, CompanyOrderStats, OrderStatus } from '../../types/order';
import type { Review, CompanyReviewSummary } from '../../types/review';
import type { Coupon, CompanyCouponMetrics, CreateCouponInput } from '../../types/coupon';

export const BusinessHomePage: React.FC = () => {
  const { user, loading: authLoading, logout, updateBusinessDetails } = useAuth();

  const [activeTab, setActiveTab] = useState<'products' | 'inventory' | 'orders' | 'reviews' | 'coupons' | 'storefront' | 'profile'>('products');

  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<CompanyStats>({
    totalProducts: 0,
    totalUnits: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  });

  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponSummary, setCouponSummary] = useState<CompanyCouponMetrics | null>(null);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [submittingCoupon, setSubmittingCoupon] = useState(false);
  const [couponModalError, setCouponModalError] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState<CreateCouponInput>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 15,
    minPurchaseAmount: 0,
    maxDiscountAmount: null,
    applicableProducts: [],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: null,
    userUsageLimit: 1,
  });
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);

  // Business Customer Reviews Management State
  const [companyReviews, setCompanyReviews] = useState<Review[]>([]);
  const [companyReviewSummary, setCompanyReviewSummary] = useState<CompanyReviewSummary | null>(null);
  const [companyReviewsLoading, setCompanyReviewsLoading] = useState(false);
  const [companyReviewProductFilter, setCompanyReviewProductFilter] = useState<string>('all');
  const [companyReviewRatingFilter, setCompanyReviewRatingFilter] = useState<number | null>(null);
  const [companyReviewReplyFilter, setCompanyReviewReplyFilter] = useState<'all' | 'unreplied' | 'replied'>('all');

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

  // Storefront & Promotions State
  const [storefrontForm, setStorefrontForm] = useState({
    bannerImage: '',
    tagline: 'Official Brand Storefront',
    description: '',
    announcement: '',
    flashSaleActive: false,
    flashSaleTitle: '⚡ Limited-Time Store Flash Sale',
    flashSaleDescription: 'Promotional discounts across verified brand inventory',
    flashSaleDiscount: 20,
    flashSaleEndsAt: '',
  });

  const [bulkDiscountForm, setBulkDiscountForm] = useState({
    discountPercentage: 20,
    category: 'all',
    isFlashSale: false,
  });

  const [savingStorefront, setSavingStorefront] = useState(false);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [storefrontSuccessMsg, setStorefrontSuccessMsg] = useState<string | null>(null);
  const [storefrontErrorMsg, setStorefrontErrorMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Quick Product-Level Discount Modal State
  const [quickDiscountProduct, setQuickDiscountProduct] = useState<Product | null>(null);
  const [quickDiscountForm, setQuickDiscountForm] = useState({
    regularPrice: '',
    discountPercentage: '',
    salePrice: '',
    isFlashSale: false,
  });
  const [savingQuickDiscount, setSavingQuickDiscount] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    price: string;
    originalPrice: string;
    discountPercentage: string;
    isFlashSale: boolean;
    category: string;
    stock: string;
    image: string;
    images: string[];
    specifications: Array<{ key: string; value: string }>;
  }>({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    discountPercentage: '',
    isFlashSale: false,
    category: 'electronics',
    stock: '',
    image: '',
    images: [],
    specifications: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const [directImageUrlInput, setDirectImageUrlInput] = useState('');
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

  const fetchStorefrontSettings = useCallback(async () => {
    if (!user || (user.role !== 'company' && user.role !== 'admin')) return;
    try {
      const res = await getStorefrontSettingsApi();
      if (res.success && res.storefront) {
        const sf = res.storefront;
        setStorefrontForm({
          bannerImage: sf.bannerImage || '',
          tagline: sf.tagline || 'Official Brand Storefront',
          description: sf.description || '',
          announcement: sf.announcement || '',
          flashSaleActive: Boolean(sf.flashSale?.isActive),
          flashSaleTitle: sf.flashSale?.title || '⚡ Limited-Time Store Flash Sale',
          flashSaleDescription: sf.flashSale?.description || '',
          flashSaleDiscount: sf.flashSale?.discountPercentage || 20,
          flashSaleEndsAt: sf.flashSale?.endsAt
            ? new Date(sf.flashSale.endsAt).toISOString().split('T')[0]
            : '',
        });
      }
    } catch (err: any) {
      console.warn('Failed to load storefront settings:', err);
    }
  }, [user]);

  const fetchCompanyReviews = useCallback(async () => {
    if (!user || (user.role !== 'company' && user.role !== 'admin')) return;
    setCompanyReviewsLoading(true);
    try {
      const res = await getCompanyReviewsApi({
        productId: companyReviewProductFilter !== 'all' ? companyReviewProductFilter : undefined,
        rating: companyReviewRatingFilter || undefined,
        replyStatus: companyReviewReplyFilter,
      });
      if (res.success) {
        setCompanyReviews(res.reviews || []);
        setCompanyReviewSummary(res.summary || null);
      }
    } catch (err: any) {
      console.warn('Failed to load company reviews:', err);
    } finally {
      setCompanyReviewsLoading(false);
    }
  }, [user, companyReviewProductFilter, companyReviewRatingFilter, companyReviewReplyFilter]);

  const fetchCoupons = useCallback(async () => {
    if (!user || (user.role !== 'company' && user.role !== 'admin')) return;
    setCouponsLoading(true);
    try {
      const res = await getMyCompanyCouponsApi();
      if (res.success) {
        setCoupons(res.coupons || []);
        setCouponSummary(res.summary || null);
      }
    } catch (err: any) {
      console.warn('Failed to load merchant coupons:', err);
    } finally {
      setCouponsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'storefront') {
      fetchStorefrontSettings();
    } else if (activeTab === 'reviews') {
      fetchCompanyReviews();
    } else if (activeTab === 'coupons') {
      fetchCoupons();
    }
  }, [activeTab, fetchOrders, fetchStorefrontSettings, fetchCompanyReviews, fetchCoupons]);

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

  const handleSaveStorefront = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStorefront(true);
    setStorefrontSuccessMsg(null);
    setStorefrontErrorMsg(null);
    try {
      const res = await updateStorefrontSettingsApi({
        bannerImage: storefrontForm.bannerImage,
        tagline: storefrontForm.tagline,
        description: storefrontForm.description,
        announcement: storefrontForm.announcement,
        flashSale: {
          isActive: storefrontForm.flashSaleActive,
          title: storefrontForm.flashSaleTitle,
          description: storefrontForm.flashSaleDescription,
          discountPercentage: Number(storefrontForm.flashSaleDiscount),
          endsAt: storefrontForm.flashSaleEndsAt ? new Date(storefrontForm.flashSaleEndsAt).toISOString() : null,
        },
      });

      if (res.success) {
        setStorefrontSuccessMsg('Storefront customizations and flash sale settings saved!');
        setTimeout(() => setStorefrontSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setStorefrontErrorMsg(err.response?.data?.message || err.message || 'Failed to save storefront settings');
    } finally {
      setSavingStorefront(false);
    }
  };

  const handleApplyBulkDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyingDiscount(true);
    setStorefrontSuccessMsg(null);
    setStorefrontErrorMsg(null);
    try {
      const res = await applyBulkDiscountApi({
        discountPercentage: Number(bulkDiscountForm.discountPercentage),
        category: bulkDiscountForm.category,
        isFlashSale: bulkDiscountForm.isFlashSale,
      });

      if (res.success) {
        setStorefrontSuccessMsg(res.message);
        setTimeout(() => setStorefrontSuccessMsg(null), 4000);
        await fetchData();
      }
    } catch (err: any) {
      setStorefrontErrorMsg(err.response?.data?.message || err.message || 'Failed to apply bulk discount');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleResetBulkDiscount = async () => {
    if (!window.confirm('Reset all product prices back to their regular prices?')) return;
    setApplyingDiscount(true);
    try {
      const res = await applyBulkDiscountApi({ reset: true });
      if (res.success) {
        setStorefrontSuccessMsg(res.message);
        setTimeout(() => setStorefrontSuccessMsg(null), 4000);
        await fetchData();
      }
    } catch (err: any) {
      setStorefrontErrorMsg(err.message || 'Failed to reset discounts');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleOpenQuickDiscount = (prod: Product) => {
    const regPrice = prod.originalPrice && prod.originalPrice > prod.price ? prod.originalPrice : prod.price;
    const hasDisc = Boolean(prod.originalPrice && prod.originalPrice > prod.price);
    const discPct = prod.discountPercentage || (hasDisc ? Math.round(((regPrice - prod.price) / regPrice) * 100) : 0);

    setQuickDiscountProduct(prod);
    setQuickDiscountForm({
      regularPrice: regPrice.toFixed(2),
      discountPercentage: hasDisc ? String(discPct) : '',
      salePrice: prod.price.toFixed(2),
      isFlashSale: Boolean(prod.isFlashSale),
    });
  };

  const handleQuickDiscountPercentageChange = (pctStr: string) => {
    const regPrice = Number(quickDiscountForm.regularPrice) || (quickDiscountProduct ? (quickDiscountProduct.originalPrice || quickDiscountProduct.price) : 0);
    const pct = Number(pctStr);
    if (!pctStr || isNaN(pct) || pct <= 0) {
      setQuickDiscountForm((prev) => ({
        ...prev,
        discountPercentage: pctStr,
        salePrice: regPrice > 0 ? regPrice.toFixed(2) : prev.salePrice,
      }));
      return;
    }
    const computedSale = Number((regPrice * (1 - pct / 100)).toFixed(2));
    setQuickDiscountForm((prev) => ({
      ...prev,
      discountPercentage: pctStr,
      salePrice: computedSale > 0 ? computedSale.toFixed(2) : '0.01',
    }));
  };

  const handleQuickDiscountSalePriceChange = (salePriceStr: string) => {
    const regPrice = Number(quickDiscountForm.regularPrice) || (quickDiscountProduct ? (quickDiscountProduct.originalPrice || quickDiscountProduct.price) : 0);
    const sale = Number(salePriceStr);
    if (!salePriceStr || isNaN(sale) || sale >= regPrice || regPrice <= 0) {
      setQuickDiscountForm((prev) => ({
        ...prev,
        salePrice: salePriceStr,
        discountPercentage: '',
      }));
      return;
    }
    const computedPct = Math.round(((regPrice - sale) / regPrice) * 100);
    setQuickDiscountForm((prev) => ({
      ...prev,
      salePrice: salePriceStr,
      discountPercentage: String(computedPct),
    }));
  };

  const handleSaveQuickDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDiscountProduct) return;
    setSavingQuickDiscount(true);
    try {
      const reg = Number(quickDiscountForm.regularPrice);
      const sale = Number(quickDiscountForm.salePrice);
      const pct = Number(quickDiscountForm.discountPercentage);

      const hasDiscount = (pct > 0 || (reg > sale)) && sale > 0 && reg > sale;

      await updateProductApi(quickDiscountProduct._id, {
        price: hasDiscount ? sale : (reg > 0 ? reg : quickDiscountProduct.price),
        originalPrice: hasDiscount ? reg : 0,
        discountPercentage: hasDiscount ? (pct > 0 ? pct : Math.round(((reg - sale) / reg) * 100)) : 0,
        isFlashSale: quickDiscountForm.isFlashSale,
      });

      setQuickDiscountProduct(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update product discount');
    } finally {
      setSavingQuickDiscount(false);
    }
  };

  const handleRemoveQuickDiscount = async () => {
    if (!quickDiscountProduct) return;
    setSavingQuickDiscount(true);
    try {
      const reg = Number(quickDiscountForm.regularPrice) || (quickDiscountProduct.originalPrice || quickDiscountProduct.price);
      await updateProductApi(quickDiscountProduct._id, {
        price: reg,
        originalPrice: 0,
        discountPercentage: 0,
        isFlashSale: false,
      });
      setQuickDiscountProduct(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove discount');
    } finally {
      setSavingQuickDiscount(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      originalPrice: '',
      discountPercentage: '',
      isFlashSale: false,
      category: 'electronics',
      stock: '',
      image: '',
      images: [],
      specifications: [
        { key: 'Brand / Manufacturer', value: user?.companyName || '' },
        { key: 'Model / Version', value: '' },
        { key: 'Warranty & Support', value: '1 Year Full Manufacturer Warranty' },
      ],
    });
    setDirectImageUrlInput('');
    setModalError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    const existingImages =
      prod.images && prod.images.length > 0
        ? [...prod.images]
        : prod.image
        ? [prod.image]
        : [];

    setFormData({
      title: prod.title,
      description: prod.description,
      price: prod.price.toString(),
      originalPrice: prod.originalPrice ? prod.originalPrice.toString() : '',
      discountPercentage: prod.discountPercentage ? prod.discountPercentage.toString() : '',
      isFlashSale: Boolean(prod.isFlashSale),
      category: prod.category,
      stock: prod.stock.toString(),
      image: prod.image || existingImages[0] || '',
      images: existingImages,
      specifications:
        prod.specifications && prod.specifications.length > 0
          ? prod.specifications.map((s) => ({ key: s.key, value: s.value }))
          : [],
    });
    setDirectImageUrlInput('');
    setModalError(null);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 10 - formData.images.length;
    if (remainingSlots <= 0) {
      setModalError('Maximum limit of 10 photos reached. Please remove a photo before uploading more.');
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      alert(`You can attach up to 10 photos total. Only the first ${remainingSlots} selected file(s) will be uploaded.`);
    }

    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        setModalError('Please select valid image files (PNG, JPG, WEBP)');
        return;
      }
      if (file.size > 500 * 1024) {
        setModalError(`File "${file.name}" exceeds 500KB limit. Please choose a smaller image.`);
        return;
      }
    }

    setUploadingImage(true);
    setUploadProgress({ completed: 0, total: filesToUpload.length });
    setModalError(null);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const result = await uploadProductImageApi(file);
        if (result.url) {
          uploadedUrls.push(result.url);
        }
        setUploadProgress({ completed: i + 1, total: filesToUpload.length });
      }

      if (uploadedUrls.length > 0) {
        setFormData((prev) => {
          const combined = [...prev.images, ...uploadedUrls].slice(0, 10);
          return {
            ...prev,
            images: combined,
            image: combined[0] || prev.image,
          };
        });
      }
    } catch (err: any) {
      setModalError(err.response?.data?.message || err.message || 'Failed to upload image(s)');
    } finally {
      setUploadingImage(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddDirectImageUrl = () => {
    if (!directImageUrlInput.trim()) return;
    if (formData.images.length >= 10) {
      setModalError('Maximum limit of 10 photos reached. Please remove a photo before adding more.');
      return;
    }
    const url = directImageUrlInput.trim();
    setFormData((prev) => {
      const combined = [...prev.images, url].slice(0, 10);
      return {
        ...prev,
        images: combined,
        image: combined[0] || prev.image,
      };
    });
    setDirectImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => {
      const nextImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: nextImages,
        image: nextImages[0] || '',
      };
    });
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setFormData((prev) => {
      const target = prev.images[index];
      const nextImages = [target, ...prev.images.filter((_, i) => i !== index)];
      return {
        ...prev,
        images: nextImages,
        image: nextImages[0] || '',
      };
    });
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.images.length) return;
    setFormData((prev) => {
      const nextImages = [...prev.images];
      const temp = nextImages[index];
      nextImages[index] = nextImages[targetIndex];
      nextImages[targetIndex] = temp;
      return {
        ...prev,
        images: nextImages,
        image: nextImages[0] || '',
      };
    });
  };

  const handleAddSpecificationRow = () => {
    setFormData((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }],
    }));
  };

  const handleUpdateSpecificationRow = (index: number, field: 'key' | 'value', val: string) => {
    setFormData((prev) => {
      const nextSpecs = [...prev.specifications];
      nextSpecs[index] = { ...nextSpecs[index], [field]: val };
      return { ...prev, specifications: nextSpecs };
    });
  };

  const handleRemoveSpecificationRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const handleApplySpecPreset = (presetType: 'electronics' | 'fashion' | 'home' | 'beauty' | 'sports') => {
    const presets: Record<string, Array<{ key: string; value: string }>> = {
      electronics: [
        { key: 'Brand / Manufacturer', value: user?.companyName || '' },
        { key: 'Model / Series', value: '' },
        { key: 'Processor / Chipset', value: '' },
        { key: 'Memory & Storage', value: '' },
        { key: 'Display Specs', value: '' },
        { key: 'Battery & Power', value: '' },
        { key: 'Connectivity', value: 'Bluetooth 5.3, Wi-Fi 6E, Type-C' },
        { key: 'Dimensions & Weight', value: '' },
        { key: 'Warranty & Support', value: '1 Year Manufacturer Warranty' },
      ],
      fashion: [
        { key: 'Brand', value: user?.companyName || '' },
        { key: 'Material Composition', value: '100% Premium Organic Cotton' },
        { key: 'Fit / Cut', value: 'Regular Fit' },
        { key: 'Care Instructions', value: 'Machine Wash Cold, Tumble Dry Low' },
        { key: 'Origin', value: 'Imported' },
        { key: 'Style Tag', value: 'Casual & Daily Wear' },
      ],
      home: [
        { key: 'Brand', value: user?.companyName || '' },
        { key: 'Material', value: 'Solid Wood / Stainless Steel' },
        { key: 'Dimensions (L x W x H)', value: '' },
        { key: 'Item Weight', value: '' },
        { key: 'Assembly Required', value: 'No - Pre-assembled' },
        { key: 'Warranty', value: '2-Year Limited Structural Warranty' },
      ],
      beauty: [
        { key: 'Brand', value: user?.companyName || '' },
        { key: 'Item Form', value: 'Serum / Cream' },
        { key: 'Skin Type', value: 'All Skin Types (Dermatologist Tested)' },
        { key: 'Key Ingredients', value: 'Hyaluronic Acid, Vitamin C, Niacinamide' },
        { key: 'Net Volume / Weight', value: '50 ml / 1.7 fl oz' },
        { key: 'Cruelty Free', value: 'Yes - 100% Cruelty Free & Vegan' },
      ],
      sports: [
        { key: 'Brand', value: user?.companyName || '' },
        { key: 'Activity / Sport', value: 'Gym, Running, Training' },
        { key: 'Material', value: 'High-Tensile Reinforced Alloy' },
        { key: 'Max Weight Capacity', value: '300 lbs / 136 kg' },
        { key: 'Water Resistance', value: 'IPX7 Sweat & Water Resistant' },
        { key: 'Warranty', value: 'Lifetime Frame Warranty' },
      ],
    };

    const chosen = presets[presetType] || presets.electronics;
    setFormData((prev) => {
      const existingKeys = new Set(prev.specifications.map((s) => s.key.toLowerCase().trim()));
      const newAdditions = chosen.filter((c) => !existingKeys.has(c.key.toLowerCase().trim()));
      return {
        ...prev,
        specifications: [...prev.specifications.filter((s) => s.key.trim() !== ''), ...newAdditions],
      };
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.price || !formData.stock) {
      setModalError('Please fill out all required fields');
      return;
    }

    setSubmitting(true);
    setModalError(null);

    const cleanImages = formData.images.filter((img) => img.trim().length > 0).slice(0, 10);
    const primaryImg = cleanImages[0] || formData.image || undefined;
    const cleanSpecs = formData.specifications.filter((s) => s.key.trim().length > 0);

    try {
      if (editingProduct) {
        await updateProductApi(editingProduct._id, {
          title: formData.title,
          description: formData.description,
          price: Number(formData.price),
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : 0,
          discountPercentage: formData.discountPercentage ? Number(formData.discountPercentage) : 0,
          isFlashSale: formData.isFlashSale,
          category: formData.category,
          stock: Number(formData.stock),
          image: primaryImg,
          images: cleanImages.length > 0 ? cleanImages : primaryImg ? [primaryImg] : [],
          specifications: cleanSpecs,
        });
        window.dispatchEvent(new CustomEvent('product-updated', { detail: { productId: editingProduct._id } }));
        setEditingProduct(null);
      } else {
        const res = await createProductApi({
          title: formData.title,
          description: formData.description,
          price: Number(formData.price),
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : 0,
          discountPercentage: formData.discountPercentage ? Number(formData.discountPercentage) : 0,
          isFlashSale: formData.isFlashSale,
          category: formData.category,
          stock: Number(formData.stock),
          image: primaryImg,
          images: cleanImages.length > 0 ? cleanImages : primaryImg ? [primaryImg] : [],
          specifications: cleanSpecs,
        });
        window.dispatchEvent(new CustomEvent('product-updated', { detail: { productId: res.product?._id } }));
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
      window.dispatchEvent(new CustomEvent('product-updated', { detail: { productId: deletingProductId } }));
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

  const handleOpenCreateCoupon = () => {
    setEditingCouponId(null);
    setCouponForm({
      code: `SAVE${Math.floor(10 + Math.random() * 89)}`,
      description: 'Special store discount on your purchase',
      discountType: 'percentage',
      discountValue: 15,
      minPurchaseAmount: 0,
      maxDiscountAmount: null,
      applicableProducts: [],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: null,
      userUsageLimit: 1,
    });
    setCouponModalError(null);
    setShowCouponModal(true);
  };

  const handleOpenEditCoupon = (coupon: Coupon) => {
    setEditingCouponId(coupon._id);
    setCouponForm({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchaseAmount: coupon.minPurchaseAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || null,
      applicableProducts: coupon.applicableProducts || [],
      endDate: new Date(coupon.endDate).toISOString().split('T')[0],
      usageLimit: coupon.usageLimit || null,
      userUsageLimit: coupon.userUsageLimit || 1,
    });
    setCouponModalError(null);
    setShowCouponModal(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCoupon(true);
    setCouponModalError(null);
    try {
      if (editingCouponId) {
        await updateCouponApi(editingCouponId, couponForm);
      } else {
        await createCouponApi(couponForm);
      }
      setShowCouponModal(false);
      await fetchCoupons();
    } catch (err: any) {
      setCouponModalError(err.message || 'Failed to save coupon');
    } finally {
      setSubmittingCoupon(false);
    }
  };

  const handleToggleCoupon = async (couponId: string) => {
    try {
      await toggleCouponApi(couponId);
      await fetchCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle coupon status');
    }
  };

  const handleDeleteCoupon = async (couponId: string, code: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) return;
    try {
      await deleteCouponApi(couponId);
      await fetchCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to delete coupon');
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
            onClick={() => setActiveTab('reviews')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Customer Reviews</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coupons')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'coupons'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Coupons & Discounts</span>
            {couponSummary && couponSummary.activeCoupons > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                {couponSummary.activeCoupons} active
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('storefront')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'storefront'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Storefront & Promotions</span>
            {storefrontForm.flashSaleActive && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-white font-extrabold animate-pulse">
                LIVE SALE
              </span>
            )}
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
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-zinc-950">
                            ${prod.price.toFixed(2)}
                          </div>
                          {prod.originalPrice && prod.originalPrice > prod.price ? (
                            <div className="flex items-center gap-1 text-[10px] mt-0.5">
                              <span className="line-through text-zinc-400">
                                ${prod.originalPrice.toFixed(2)}
                              </span>
                              <span className="text-rose-600 font-extrabold bg-rose-50 px-1 rounded border border-rose-100">
                                -{prod.discountPercentage || Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)}%
                              </span>
                            </div>
                          ) : null}
                          {prod.isFlashSale && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-white uppercase tracking-wider mt-1">
                              ⚡ Flash Deal
                            </span>
                          )}
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
                              onClick={() => handleOpenQuickDiscount(prod)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                                prod.originalPrice && prod.originalPrice > prod.price
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-2xs'
                                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
                              }`}
                              title="Set or update discount for this product"
                            >
                              <Percent className="w-3 h-3 text-rose-600" />
                              <span>{prod.originalPrice && prod.originalPrice > prod.price ? 'Edit Discount' : 'Discount'}</span>
                            </button>
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

        {activeTab === 'storefront' && (
          <div className="space-y-6">
            {/* Top Storefront Header Card */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <Store className="w-5 h-5" />
                    </span>
                    <h3 className="text-base font-extrabold text-zinc-950">
                      Storefront Customization & Brand Hub
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Customize your public storefront banner, announcement ribbons, and launch live flash sale promotions.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <Link
                    to={`/store/${encodeURIComponent(user?.companyName || user?.name || 'store')}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Public Store</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </Link>
                </div>
              </div>

              {storefrontSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{storefrontSuccessMsg}</span>
                </div>
              )}

              {storefrontErrorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{storefrontErrorMsg}</span>
                </div>
              )}
            </div>

            {/* Form Section 1: Storefront Banner & Branding */}
            <form onSubmit={handleSaveStorefront} className="space-y-6">
              <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-950">
                        Store Banner & Visual Identity
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Custom backdrop image and hero headlines displayed to shoppers
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Banner Preview & Input */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Storefront Hero Banner Image URL
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={storefrontForm.bannerImage}
                        onChange={(e) =>
                          setStorefrontForm((prev) => ({ ...prev, bannerImage: e.target.value }))
                        }
                        placeholder="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&q=80"
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                      />
                      {storefrontForm.bannerImage && (
                        <button
                          type="button"
                          onClick={() => setStorefrontForm((prev) => ({ ...prev, bannerImage: '' }))}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-rose-600 bg-zinc-100 hover:bg-zinc-200"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Or Pick a Curated Banner Preset:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          {
                            name: 'Midnight Tech',
                            url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&q=80',
                          },
                          {
                            name: 'Modern Studio',
                            url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1600&q=80',
                          },
                          {
                            name: 'Luxe Gradient',
                            url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80',
                          },
                          {
                            name: 'Minimal Dark',
                            url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&q=80',
                          },
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() =>
                              setStorefrontForm((prev) => ({ ...prev, bannerImage: preset.url }))
                            }
                            className={`p-2 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                              storefrontForm.bannerImage === preset.url
                                ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                            }`}
                          >
                            <span className="block truncate">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Banner Preview Box */}
                    {storefrontForm.bannerImage && (
                      <div className="relative h-32 rounded-2xl overflow-hidden border border-zinc-200 mt-2 bg-zinc-950">
                        <img
                          src={storefrontForm.bannerImage}
                          alt="Banner Preview"
                          className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end text-white">
                          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">
                            Live Banner Preview
                          </span>
                          <span className="text-base font-extrabold">
                            {user?.companyName || 'Brand Store'}
                          </span>
                          <span className="text-xs text-zinc-300">
                            {storefrontForm.tagline || 'Official Brand Storefront'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                        Store Tagline / Slogan
                      </label>
                      <input
                        type="text"
                        value={storefrontForm.tagline}
                        onChange={(e) =>
                          setStorefrontForm((prev) => ({ ...prev, tagline: e.target.value }))
                        }
                        placeholder="e.g. Flagship Audio & High Performance Wearables"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                        Top Announcement Ribbon Text
                      </label>
                      <input
                        type="text"
                        value={storefrontForm.announcement}
                        onChange={(e) =>
                          setStorefrontForm((prev) => ({ ...prev, announcement: e.target.value }))
                        }
                        placeholder="e.g. 🎉 FREE EXPEDITED SHIPPING ON ALL ORDERS THIS WEEKEND!"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Store Bio & Merchant Story
                    </label>
                    <textarea
                      rows={3}
                      value={storefrontForm.description}
                      onChange={(e) =>
                        setStorefrontForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Tell customers about your brand heritage, warranty terms, and craftsmanship..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                    />
                  </div>
                </div>
              </div>

              {/* Form Section 2: Flash Sale Campaign Manager */}
              <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-950">
                        Flash Sale & Promotional Campaign
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Launch a high-conversion flash sale with countdown timer on your storefront
                      </p>
                    </div>
                  </div>

                  {/* Active Toggle Switch */}
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs font-bold text-zinc-800">
                      {storefrontForm.flashSaleActive ? 'Flash Sale ON' : 'Flash Sale OFF'}
                    </span>
                    <input
                      type="checkbox"
                      checked={storefrontForm.flashSaleActive}
                      onChange={(e) =>
                        setStorefrontForm((prev) => ({
                          ...prev,
                          flashSaleActive: e.target.checked,
                        }))
                      }
                      className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {storefrontForm.flashSaleActive && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="block text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                          Flash Sale Title / Headline
                        </label>
                        <input
                          type="text"
                          value={storefrontForm.flashSaleTitle}
                          onChange={(e) =>
                            setStorefrontForm((prev) => ({
                              ...prev,
                              flashSaleTitle: e.target.value,
                            }))
                          }
                          placeholder="⚡ Midnight Super Sale - Up to 40% OFF"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-amber-500 font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                          Sale Ends At (Countdown)
                        </label>
                        <input
                          type="date"
                          value={storefrontForm.flashSaleEndsAt}
                          onChange={(e) =>
                            setStorefrontForm((prev) => ({
                              ...prev,
                              flashSaleEndsAt: e.target.value,
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-amber-500 font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                        Campaign Description
                      </label>
                      <input
                        type="text"
                        value={storefrontForm.flashSaleDescription}
                        onChange={(e) =>
                          setStorefrontForm((prev) => ({
                            ...prev,
                            flashSaleDescription: e.target.value,
                          }))
                        }
                        placeholder="Grab verified brand collections at special promotional prices for a limited time!"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingStorefront}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {savingStorefront ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Customizations...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-emerald-400" />
                        <span>Save Storefront & Flash Sale Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Section 3: Bulk Product Discount & Sale Pricing Tool */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-950">
                      Bulk Catalog Discount Tool
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Apply instant % discounts across your entire catalog or specific categories
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleApplyBulkDiscount} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Discount Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={bulkDiscountForm.discountPercentage}
                        onChange={(e) =>
                          setBulkDiscountForm((prev) => ({
                            ...prev,
                            discountPercentage: Number(e.target.value),
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950"
                        required
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                        % OFF
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Target Category
                    </label>
                    <select
                      value={bulkDiscountForm.category}
                      onChange={(e) =>
                        setBulkDiscountForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-950 capitalize"
                    >
                      <option value="all">All Products in Store</option>
                      <option value="electronics">Electronics</option>
                      <option value="fashion">Fashion & Apparel</option>
                      <option value="home">Home & Living</option>
                      <option value="beauty">Beauty & Skincare</option>
                      <option value="sports">Sports & Outdoors</option>
                      <option value="books">Books & Media</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="inline-flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bulkDiscountForm.isFlashSale}
                        onChange={(e) =>
                          setBulkDiscountForm((prev) => ({
                            ...prev,
                            isFlashSale: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span>Tag as ⚡ Flash Sale Deal</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetBulkDiscount}
                    disabled={applyingDiscount}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:text-rose-600 bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Reset All Product Discounts
                  </button>

                  <button
                    type="submit"
                    disabled={applyingDiscount}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {applyingDiscount ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Applying Discounts...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Apply {bulkDiscountForm.discountPercentage}% Discount to Catalog</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
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

        {/* Customer Reviews & Reputation Management Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-zinc-950 tracking-tight">
                  Customer Reviews & Store Reputation
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Monitor buyer feedback, track product satisfaction ratings, and publish official merchant responses
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchCompanyReviews()}
                disabled={companyReviewsLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-xs font-bold text-zinc-800 transition-colors shadow-2xs cursor-pointer"
              >
                <Loader2 className={`w-3.5 h-3.5 ${companyReviewsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Reviews</span>
              </button>
            </div>

            {/* Overview Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Store Average Rating</span>
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                </div>
                <div className="text-2xl font-extrabold text-zinc-950 font-mono">
                  {(companyReviewSummary?.totalReviews || 0) > 0
                    ? (companyReviewSummary?.averageRating || 0).toFixed(1)
                    : '0.0'}
                  <span className="text-xs text-zinc-400 font-sans font-normal ml-1">/ 5.0</span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  {(companyReviewSummary?.totalReviews || 0) > 0
                    ? 'Across all catalog reviews'
                    : 'No customer reviews yet'}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Total Customer Reviews</span>
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-extrabold text-zinc-950 font-mono">
                  {companyReviewSummary?.totalReviews || 0}
                </div>
                <div className="text-[11px] text-zinc-500">Verified customer submissions</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Needs Merchant Reply</span>
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-extrabold text-amber-600 font-mono flex items-center gap-2">
                  <span>{companyReviewSummary?.unrepliedCount || 0}</span>
                  {(companyReviewSummary?.unrepliedCount || 0) > 0 && (
                    <span className="text-[10px] font-sans font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Action Required
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-500">Unanswered customer reviews</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Official Responses</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-zinc-950 font-mono">
                  {companyReviewSummary?.repliedCount || 0}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium">Published merchant replies</div>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Product Selector */}
                <div className="flex items-center gap-2 min-w-[240px]">
                  <span className="text-xs font-bold text-zinc-700 whitespace-nowrap">
                    Product Filter:
                  </span>
                  <select
                    value={companyReviewProductFilter}
                    onChange={(e) => setCompanyReviewProductFilter(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer"
                  >
                    <option value="all">All Products ({products.length})</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title} ({p.numReviews || 0} reviews)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 bg-zinc-100/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCompanyReviewReplyFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      companyReviewReplyFilter === 'all'
                        ? 'bg-white text-zinc-950 shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    All ({companyReviewSummary?.totalReviews || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanyReviewReplyFilter('unreplied')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      companyReviewReplyFilter === 'unreplied'
                        ? 'bg-amber-400 text-zinc-950 shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    <span>Needs Reply</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-950 text-white font-mono font-bold">
                      {companyReviewSummary?.unrepliedCount || 0}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanyReviewReplyFilter('replied')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      companyReviewReplyFilter === 'replied'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    Replied ({companyReviewSummary?.repliedCount || 0})
                  </button>
                </div>
              </div>

              {/* Star Rating Quick Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-100">
                <span className="text-[11px] font-semibold text-zinc-500 mr-1">Rating:</span>
                <button
                  type="button"
                  onClick={() => setCompanyReviewRatingFilter(null)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                    companyReviewRatingFilter === null
                      ? 'bg-zinc-950 text-white border-zinc-950'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  All Stars
                </button>
                {[5, 4, 3, 2, 1].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setCompanyReviewRatingFilter(companyReviewRatingFilter === s ? null : s)
                    }
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border flex items-center gap-1 ${
                      companyReviewRatingFilter === s
                        ? 'bg-amber-400 text-zinc-950 border-amber-400 font-extrabold'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <span>{s}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Reviews Feed */}
            <div className="space-y-4">
              {companyReviewsLoading ? (
                <div className="space-y-4 py-6">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="p-6 rounded-3xl bg-white border border-zinc-200 animate-pulse space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-200" />
                        <div className="space-y-1.5">
                          <div className="w-32 h-3.5 bg-zinc-200 rounded-md" />
                          <div className="w-20 h-3 bg-zinc-200 rounded-md" />
                        </div>
                      </div>
                      <div className="w-48 h-4 bg-zinc-200 rounded-md" />
                      <div className="w-full h-12 bg-zinc-200 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : companyReviews.length === 0 ? (
                <div className="bg-white rounded-3xl border border-zinc-200/80 p-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-zinc-950">
                      {companyReviewReplyFilter !== 'all' || companyReviewRatingFilter || companyReviewProductFilter !== 'all'
                        ? 'No reviews match your selected filter criteria'
                        : 'No Customer Reviews Yet'}
                    </h4>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      {companyReviewReplyFilter !== 'all' || companyReviewRatingFilter || companyReviewProductFilter !== 'all'
                        ? 'Try selecting "All Products" or clearing status filters to view all customer reviews.'
                        : 'Once customers buy your products and leave ratings, their reviews and photos will appear right here.'}
                    </p>
                  </div>
                  {(companyReviewReplyFilter !== 'all' || companyReviewRatingFilter || companyReviewProductFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setCompanyReviewReplyFilter('all');
                        setCompanyReviewRatingFilter(null);
                        setCompanyReviewProductFilter('all');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-100 transition-colors shadow-2xs cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {companyReviews.map((rev) => (
                    <ReviewCard
                      key={rev._id}
                      review={rev}
                      isMerchantOwner={true}
                      onReviewUpdated={(updated) => {
                        setCompanyReviews((prev) =>
                          prev.map((r) => (r._id === updated._id ? updated : r))
                        );
                        fetchCompanyReviews();
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Product Ratings Health Overview Table */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 overflow-hidden shadow-xs mt-8">
              <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-950">Product Ratings Health Table</h4>
                  <p className="text-[11px] text-zinc-500">Summary rating performance across all active catalog listings</p>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="p-12 text-center text-xs text-zinc-500">
                  No catalog products found. Create your first product listing to start collecting customer reviews.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/80 border-b border-zinc-100 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Product Details</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Average Rating</th>
                        <th className="py-3 px-4">Total Reviews</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium text-zinc-900">
                      {products.map((prod) => (
                        <tr key={prod._id} className="hover:bg-zinc-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.images?.[0] || prod.image}
                                alt={prod.title}
                                className="w-10 h-10 rounded-xl object-contain bg-zinc-50 border border-zinc-200 shrink-0 p-0.5"
                              />
                              <div className="min-w-0 max-w-xs">
                                <span className="font-bold text-zinc-950 truncate block">{prod.title}</span>
                                <span className="text-[10px] text-zinc-400 font-mono">ID: {prod._id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 capitalize text-zinc-600">
                            {prod.category}
                          </td>
                          <td className="py-3 px-4">
                            {(prod.numReviews || 0) > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center gap-0.5 text-amber-400">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-3.5 h-3.5 ${
                                        s <= Math.round(prod.rating || 0)
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-zinc-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="font-bold text-xs text-zinc-900">
                                  {(prod.rating || 0).toFixed(1)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-zinc-400 font-medium">
                                No reviews yet
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-800">
                              <MessageSquare className="w-3 h-3 text-zinc-500" />
                              <span>{prod.numReviews || 0} reviews</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setCompanyReviewProductFilter(prod._id);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                            >
                              <span>Filter Reviews</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: COUPONS & PROMOTIONAL DISCOUNTS */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            {/* Header & Create CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                  <Ticket className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Promo & Loyalty Suite</span>
                </div>
                <h3 className="text-xl font-black text-zinc-950 tracking-tight">
                  Store Coupons & Discount Management
                </h3>
                <p className="text-xs text-zinc-500 max-w-xl leading-relaxed">
                  Design promotional discount codes, percentage vouchers, minimum cart thresholds, and customer redemption limits for your store.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenCreateCoupon}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs shadow-md transition-transform active:scale-[0.98] cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Coupon</span>
              </button>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Ticket className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-500">Active Coupons</div>
                  <div className="text-2xl font-black text-zinc-950 tracking-tight">
                    {couponSummary?.activeCoupons || 0}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold">Currently redeemable</div>
                </div>
              </div>

              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-500">Total Redemptions</div>
                  <div className="text-2xl font-black text-zinc-950 tracking-tight">
                    {couponSummary?.totalRedemptions || 0}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-medium">Orders with discounts</div>
                </div>
              </div>

              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-500">Savings Delivered</div>
                  <div className="text-2xl font-black text-zinc-950 tracking-tight font-mono">
                    ${(couponSummary?.totalSavingsGranted || 0).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-violet-600 font-bold">Shopper value granted</div>
                </div>
              </div>

              <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-500">Total Campaigns</div>
                  <div className="text-2xl font-black text-zinc-950 tracking-tight">
                    {couponSummary?.totalCoupons || 0}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-medium">Created to date</div>
                </div>
              </div>
            </div>

            {/* Coupons List */}
            {couponsLoading ? (
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-16 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
                <Loader2 className="w-8 h-8 text-zinc-950 animate-spin" />
                <p className="text-xs text-zinc-500 font-mono">Loading store coupon campaigns...</p>
              </div>
            ) : coupons.length === 0 ? (
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-16 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600">
                  <Ticket className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-zinc-950">No Store Coupons Created Yet</h4>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto">
                    Attract new buyers and reward loyal shoppers with seasonal promo codes, discount percentages, or instant checkout credits.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreateCoupon}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-bold shadow-xs hover:bg-zinc-800 transition-transform active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Store Coupon</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {coupons.map((coupon) => {
                  const isExpired = new Date(coupon.endDate) <= new Date();
                  const isLimitReached = coupon.usageLimit ? coupon.usageCount >= coupon.usageLimit : false;
                  const isLive = coupon.isActive && !isExpired && !isLimitReached;

                  return (
                    <div
                      key={coupon._id}
                      className={`bg-white border rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5 transition-all hover:shadow-md ${
                        isLive ? 'border-zinc-200/90' : 'border-zinc-200/50 opacity-75 bg-zinc-50/50'
                      }`}
                    >
                      {/* Top Bar: Code Badge + Status Chip */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-sm tracking-wider px-3 py-1.5 rounded-xl bg-zinc-950 text-white shadow-2xs">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(coupon.code);
                              setCopiedCouponCode(coupon.code);
                              setTimeout(() => setCopiedCouponCode(null), 2000);
                            }}
                            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
                            title="Copy Promo Code"
                          >
                            {copiedCouponCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Expired
                          </span>
                        ) : isLimitReached ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Max Limit
                          </span>
                        ) : coupon.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                            Paused
                          </span>
                        )}
                      </div>

                      {/* Discount Headline */}
                      <div className="space-y-1">
                        <div className="text-2xl font-black text-zinc-950 tracking-tight">
                          {coupon.discountType === 'percentage' ? (
                            <span>{coupon.discountValue}% OFF</span>
                          ) : (
                            <span>${coupon.discountValue.toFixed(2)} OFF</span>
                          )}
                          {coupon.maxDiscountAmount && coupon.discountType === 'percentage' && (
                            <span className="text-xs font-semibold text-zinc-400 font-mono ml-2">
                              (Up to ${coupon.maxDiscountAmount.toFixed(2)})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                          {coupon.description}
                        </p>
                      </div>

                      {/* Rules & Eligibility */}
                      <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-3.5 space-y-2 text-[11px]">
                        <div className="flex items-center justify-between text-zinc-600">
                          <span className="font-medium">Min. Order Value:</span>
                          <span className="font-bold font-mono text-zinc-900">
                            {coupon.minPurchaseAmount > 0
                              ? `$${coupon.minPurchaseAmount.toFixed(2)}`
                              : 'No Minimum'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-600">
                          <span className="font-medium">Valid Until:</span>
                          <span className="font-bold text-zinc-900">
                            {new Date(coupon.endDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-600">
                          <span className="font-medium">Times Redeemed:</span>
                          <span className="font-bold font-mono text-zinc-900">
                            {coupon.usageCount}
                            {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' (Unlimited)'}
                          </span>
                        </div>
                        {coupon.totalDiscountGiven > 0 && (
                          <div className="flex items-center justify-between text-zinc-600 pt-1 border-t border-zinc-200/60">
                            <span className="font-medium text-violet-700">Total Savings Given:</span>
                            <span className="font-black font-mono text-violet-700">
                              ${coupon.totalDiscountGiven.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100">
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(coupon._id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                            coupon.isActive
                              ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {coupon.isActive ? 'Pause' : 'Activate'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCoupon(coupon)}
                            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
                            title="Edit Coupon Settings"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon._id, coupon.code)}
                            className="p-2 rounded-xl border border-zinc-200 hover:border-rose-200 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Quick Individual Product Discount Modal */}
      {quickDiscountProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setQuickDiscountProduct(null)}
        >
          <div
            className="bg-white border border-zinc-200 max-w-md w-full p-6 sm:p-7 rounded-3xl shadow-2xl space-y-5 text-zinc-900 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-zinc-200/80 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={quickDiscountProduct.image}
                  alt={quickDiscountProduct.title}
                  className="w-12 h-12 rounded-xl object-cover border border-zinc-200 shrink-0"
                />
                <div>
                  <h3 className="text-base font-extrabold text-zinc-950 line-clamp-1">
                    {quickDiscountProduct.title}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Update promotional pricing or flash sale status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickDiscountProduct(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-950 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickDiscount} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                  Regular List Price (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={quickDiscountForm.regularPrice}
                  onChange={(e) => {
                    const newReg = e.target.value;
                    const pct = Number(quickDiscountForm.discountPercentage);
                    let computedSale = quickDiscountForm.salePrice;
                    if (newReg && pct > 0) {
                      computedSale = (Number(newReg) * (1 - pct / 100)).toFixed(2);
                    }
                    setQuickDiscountForm({
                      ...quickDiscountForm,
                      regularPrice: newReg,
                      salePrice: computedSale,
                    });
                  }}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 font-bold focus:outline-none focus:bg-white focus:border-zinc-900"
                  placeholder="100.00"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    Discount (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      placeholder="20"
                      value={quickDiscountForm.discountPercentage}
                      onChange={(e) => handleQuickDiscountPercentageChange(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 pr-7 text-xs text-zinc-900 font-bold focus:outline-none focus:bg-white focus:border-zinc-900"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                      %
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    Sale Price (USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="80.00"
                      value={quickDiscountForm.salePrice}
                      onChange={(e) => handleQuickDiscountSalePriceChange(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 pl-6 text-xs text-zinc-900 font-extrabold focus:outline-none focus:bg-white focus:border-zinc-900"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Quick Discount Presets
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[10, 15, 20, 25, 30, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleQuickDiscountPercentageChange(String(pct))}
                      className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {pct}%
                    </button>
                  ))}
                  {Number(quickDiscountForm.discountPercentage) > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const reg = quickDiscountForm.regularPrice || String(quickDiscountProduct.price);
                        setQuickDiscountForm({
                          regularPrice: reg,
                          discountPercentage: '',
                          salePrice: reg,
                          isFlashSale: false,
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Flash Sale Tagging */}
              <label className="inline-flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold text-zinc-800 cursor-pointer transition-colors w-full">
                <input
                  type="checkbox"
                  checked={quickDiscountForm.isFlashSale}
                  onChange={(e) =>
                    setQuickDiscountForm({ ...quickDiscountForm, isFlashSale: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="inline-flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>Feature in Store Flash Sale</span>
                </span>
              </label>

              {/* Live Calculated Preview Banner */}
              {Number(quickDiscountForm.regularPrice) > Number(quickDiscountForm.salePrice) &&
                Number(quickDiscountForm.salePrice) > 0 && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-900 text-xs font-bold flex items-center justify-between">
                    <span>Active Promotional Savings:</span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black">
                      Save $
                      {(
                        Number(quickDiscountForm.regularPrice) -
                        Number(quickDiscountForm.salePrice)
                      ).toFixed(2)}{' '}
                      (
                      {quickDiscountForm.discountPercentage ||
                        Math.round(
                          ((Number(quickDiscountForm.regularPrice) -
                            Number(quickDiscountForm.salePrice)) /
                            Number(quickDiscountForm.regularPrice)) *
                            100
                        )}
                      % OFF)
                    </span>
                  </div>
                )}

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100">
                {quickDiscountProduct.originalPrice && quickDiscountProduct.originalPrice > quickDiscountProduct.price ? (
                  <button
                    type="button"
                    onClick={handleRemoveQuickDiscount}
                    disabled={savingQuickDiscount}
                    className="px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Remove Discount
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickDiscountProduct(null)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingQuickDiscount}
                    className="px-5 py-2 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    {savingQuickDiscount ? 'Saving...' : 'Apply Discount'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {(showAddModal || editingProduct) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
        >
          <div
            className="bg-white border border-zinc-200 max-w-2xl w-full p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4">
              <div>
                <h3 className="text-xl font-bold text-zinc-950">
                  {editingProduct ? 'Edit Product Listing' : 'Add New Product Listing'}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {editingProduct
                    ? 'Modify catalog details, multi-photo reference gallery, and technical specifications'
                    : 'Publish an item directly to the live marketplace with up to 10 photos and technical specs'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-950 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sony WH-1000XM5 Wireless Noise-Canceling Headphones"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    Overview Description *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide a comprehensive summary of key features, uses, and benefits..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900"
                    required
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/80">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    Regular Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="100.00"
                    value={formData.originalPrice}
                    onChange={(e) => {
                      const orig = e.target.value;
                      const pct = Number(formData.discountPercentage);
                      let newPrice = formData.price;
                      if (orig && pct > 0) {
                        newPrice = (Number(orig) * (1 - pct / 100)).toFixed(2);
                      }
                      setFormData({ ...formData, originalPrice: orig, price: newPrice });
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    placeholder="20"
                    value={formData.discountPercentage}
                    onChange={(e) => {
                      const pctStr = e.target.value;
                      const pct = Number(pctStr);
                      const orig = Number(formData.originalPrice) || Number(formData.price);
                      let newPrice = formData.price;
                      let newOrig = formData.originalPrice;
                      if (pct > 0 && orig > 0) {
                        newOrig = String(orig);
                        newPrice = (orig * (1 - pct / 100)).toFixed(2);
                      }
                      setFormData({
                        ...formData,
                        discountPercentage: pctStr,
                        originalPrice: newOrig,
                        price: newPrice,
                      });
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    Sale Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="80.00"
                    value={formData.price}
                    onChange={(e) => {
                      const pStr = e.target.value;
                      const p = Number(pStr);
                      const orig = Number(formData.originalPrice);
                      let newPct = formData.discountPercentage;
                      if (orig > p && p > 0) {
                        newPct = String(Math.round(((orig - p) / orig) * 100));
                      }
                      setFormData({ ...formData, price: pStr, discountPercentage: newPct });
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 font-extrabold placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
                    required
                  />
                </div>

                <div className="sm:col-span-3 pt-1 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
                      Presets:
                    </span>
                    {[10, 15, 20, 25, 30, 50].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          const basePrice = Number(formData.originalPrice) || Number(formData.price) || 0;
                          if (basePrice <= 0) return;
                          const sale = Number((basePrice * (1 - preset / 100)).toFixed(2));
                          setFormData({
                            ...formData,
                            originalPrice: String(basePrice),
                            discountPercentage: String(preset),
                            price: String(sale),
                          });
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 transition-colors cursor-pointer"
                      >
                        {preset}% OFF
                      </button>
                    ))}
                  </div>

                  {(Number(formData.originalPrice) > Number(formData.price) || Number(formData.discountPercentage) > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        const orig = Number(formData.originalPrice) || Number(formData.price);
                        setFormData({
                          ...formData,
                          price: String(orig),
                          originalPrice: '',
                          discountPercentage: '',
                          isFlashSale: false,
                        });
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear Discount
                    </button>
                  )}
                </div>
              </div>

              {/* Stock, Flash Sale & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    Stock Units *
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

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="inline-flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80 text-xs font-bold text-zinc-800 cursor-pointer transition-colors h-[38px]">
                    <input
                      type="checkbox"
                      checked={formData.isFlashSale}
                      onChange={(e) =>
                        setFormData({ ...formData, isFlashSale: e.target.checked })
                      }
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span className="inline-flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-600" />
                      <span>Flash Sale</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* MULTI-PHOTO REFERENCE GALLERY (UP TO 10 PHOTOS)     */}
              {/* ---------------------------------------------------- */}
              <div className="p-5 rounded-3xl border border-zinc-200 bg-zinc-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                        Product Reference Photos
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        formData.images.length >= 10
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {formData.images.length} / 10 Photos
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Upload up to 10 high-resolution photos for reference. The first photo is your primary cover.
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                    <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Cloud Storage</span>
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileUpload}
                  accept="image/png, image/jpeg, image/webp, image/jpg"
                  multiple
                  className="hidden"
                />

                {/* Upload Action Area */}
                {formData.images.length < 10 && (
                  <div className="space-y-3">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const droppedFiles = Array.from(e.dataTransfer.files || []);
                        if (droppedFiles.length > 0) {
                          const fakeEvent = {
                            target: { files: droppedFiles },
                          } as any;
                          handleImageFileUpload(fakeEvent);
                        }
                      }}
                      className="group border-2 border-dashed border-zinc-300 hover:border-zinc-950 rounded-2xl p-5 text-center bg-white hover:bg-zinc-50/80 transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-700 group-hover:scale-105 transition-transform">
                        {uploadingImage ? (
                          <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                        ) : (
                          <Upload className="w-4 h-4 text-zinc-700" />
                        )}
                      </div>
                      <div className="text-xs font-semibold text-zinc-900">
                        {uploadingImage
                          ? uploadProgress
                            ? `Uploading photo ${uploadProgress.completed} of ${uploadProgress.total}...`
                            : 'Uploading photos to Cloudinary...'
                          : 'Click to select multiple photos or drag & drop'}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        PNG, JPG, WEBP (Max 500KB per photo) • Add up to {10 - formData.images.length} more
                      </div>
                    </div>

                    {/* Direct Image URL input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="Or paste direct image URL (https://...)"
                        value={directImageUrlInput}
                        onChange={(e) => setDirectImageUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddDirectImageUrl();
                          }
                        }}
                        className="flex-1 rounded-xl border border-zinc-200 bg-white p-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
                      />
                      <button
                        type="button"
                        onClick={handleAddDirectImageUrl}
                        disabled={!directImageUrlInput.trim()}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-40 cursor-pointer shadow-xs transition-colors"
                      >
                        + Add URL
                      </button>
                    </div>
                  </div>
                )}

                {/* Uploaded Photos Grid */}
                {formData.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    {formData.images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className={`relative group aspect-square rounded-2xl overflow-hidden bg-zinc-100 border-2 transition-all shadow-xs ${
                          idx === 0
                            ? 'border-indigo-600 ring-2 ring-indigo-200'
                            : 'border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Product photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                          }}
                        />

                        {/* Badge for Cover */}
                        {idx === 0 ? (
                          <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] font-extrabold uppercase tracking-wider shadow-xs flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-white" />
                            <span>Cover</span>
                          </div>
                        ) : (
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-zinc-950/70 text-white text-[9px] font-bold">
                            #{idx + 1}
                          </div>
                        )}

                        {/* Action Overlays */}
                        <div className="absolute inset-0 bg-zinc-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                          <div className="flex items-center justify-between">
                            {idx > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(idx)}
                                className="px-2 py-1 rounded bg-white text-zinc-950 hover:bg-indigo-50 text-[10px] font-bold shadow-xs cursor-pointer"
                                title="Make Primary Cover"
                              >
                                ★ Cover
                              </button>
                            ) : (
                              <span className="text-[10px] text-white font-bold">Primary</span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                              title="Delete Photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Reordering Controls */}
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveImage(idx, 'left')}
                              className="p-1 rounded bg-white/90 hover:bg-white text-zinc-900 disabled:opacity-30 cursor-pointer shadow-xs"
                              title="Move Left"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === formData.images.length - 1}
                              onClick={() => handleMoveImage(idx, 'right')}
                              className="p-1 rounded bg-white/90 hover:bg-white text-zinc-900 disabled:opacity-30 cursor-pointer shadow-xs"
                              title="Move Right"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 text-xs text-zinc-400 bg-white rounded-2xl border border-zinc-200/80">
                    No reference photos attached yet. Upload photos to help buyers inspect your product.
                  </div>
                )}
              </div>

              {/* ---------------------------------------------------- */}
              {/* DYNAMIC KEY-VALUE TECHNICAL SPECIFICATIONS BUILDER   */}
              {/* ---------------------------------------------------- */}
              <div className="p-5 rounded-3xl border border-zinc-200 bg-zinc-50/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                        Technical Specifications (Key-Value Pairs)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                        {formData.specifications.length} Specs
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Define technical specifications for shoppers to review before purchasing.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSpecificationRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-bold shadow-xs cursor-pointer transition-colors self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>

                {/* Quick Templates */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Quick Industry Templates:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'electronics', label: '⚡ Electronics' },
                      { id: 'fashion', label: '👗 Fashion' },
                      { id: 'home', label: '🏡 Home & Living' },
                      { id: 'beauty', label: '✨ Beauty' },
                      { id: 'sports', label: '🏃 Sports' },
                    ].map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleApplySpecPreset(tpl.id as any)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 transition-colors cursor-pointer"
                      >
                        {tpl.label}
                      </button>
                    ))}
                    {formData.specifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, specifications: [] })}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                      >
                        Clear All Specs
                      </button>
                    )}
                  </div>
                </div>

                {/* Key-Value Pair Rows */}
                {formData.specifications.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                      <div className="col-span-5">Specification Key / Attribute</div>
                      <div className="col-span-6">Technical Value</div>
                      <div className="col-span-1 text-center">Action</div>
                    </div>

                    {formData.specifications.map((spec, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-zinc-200 shadow-2xs group hover:border-zinc-400 transition-colors"
                      >
                        <div className="col-span-5">
                          <input
                            type="text"
                            placeholder="e.g. Processor / Battery / Material"
                            value={spec.key}
                            onChange={(e) =>
                              handleUpdateSpecificationRow(idx, 'key', e.target.value)
                            }
                            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 font-medium"
                          />
                        </div>
                        <div className="col-span-6">
                          <input
                            type="text"
                            placeholder="e.g. Apple M3 Max / 22 Hours / Titanium"
                            value={spec.value}
                            onChange={(e) =>
                              handleUpdateSpecificationRow(idx, 'value', e.target.value)
                            }
                            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecificationRow(idx)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove Specification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 text-xs text-zinc-400 bg-white rounded-2xl border border-zinc-200/80">
                    No technical specifications added yet. Click &quot;Add Row&quot; or select a template above.
                  </div>
                )}
              </div>

              {/* Submit & Cancel Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-950 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 transition-all cursor-pointer shadow-md disabled:opacity-60"
                >
                  {submitting
                    ? 'Saving...'
                    : editingProduct
                    ? 'Save Product Listing'
                    : 'Publish Listing'}
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

      {/* CREATE / EDIT STORE COUPON MODAL */}
      {showCouponModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setShowCouponModal(false)}
        >
          <div
            className="bg-white border border-zinc-200/90 max-w-xl w-full my-8 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 text-zinc-900 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-950">
                    {editingCouponId ? 'Edit Store Coupon' : 'Create Store Coupon Offer'}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Set discount parameters, eligibility thresholds, and expiration schedule
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCouponModal(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error message */}
            {couponModalError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{couponModalError}</span>
              </div>
            )}

            {/* Coupon Form */}
            <form onSubmit={handleSaveCoupon} className="space-y-4">
              {/* Promo Code & Generator */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                  Promo Code Name *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={couponForm.code}
                    onChange={(e) =>
                      setCouponForm((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase().replace(/\s+/g, ''),
                      }))
                    }
                    placeholder="e.g. FLASH25"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 font-mono font-bold text-sm tracking-wider text-zinc-950 uppercase focus:outline-none focus:bg-white focus:border-zinc-950"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setCouponForm((prev) => ({
                        ...prev,
                        code: `DEAL${Math.floor(100 + Math.random() * 900)}`,
                      }))
                    }
                    className="px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-xs font-bold text-zinc-700 transition-colors cursor-pointer"
                  >
                    🎲 Generate
                  </button>
                </div>
              </div>

              {/* Offer Description */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                  Offer Description / Banner Copy *
                </label>
                <input
                  type="text"
                  required
                  value={couponForm.description}
                  onChange={(e) =>
                    setCouponForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="e.g. 20% off all orders over $40 for loyal members"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-950 focus:outline-none focus:bg-white focus:border-zinc-950"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                    Discount Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCouponForm((prev) => ({ ...prev, discountType: 'percentage' }))
                      }
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        couponForm.discountType === 'percentage'
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      <span>Percentage %</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCouponForm((prev) => ({ ...prev, discountType: 'fixed' }))
                      }
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        couponForm.discountType === 'fixed'
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Fixed Cash $</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                    Discount Value ({couponForm.discountType === 'percentage' ? '%' : '$'}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    max={couponForm.discountType === 'percentage' ? '100' : '9999'}
                    step="any"
                    value={couponForm.discountValue || ''}
                    onChange={(e) =>
                      setCouponForm((prev) => ({
                        ...prev,
                        discountValue: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder={couponForm.discountType === 'percentage' ? '15' : '10.00'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 font-mono font-bold text-sm text-zinc-950 focus:outline-none focus:bg-white focus:border-zinc-950"
                  />
                </div>
              </div>

              {/* Threshold & Cap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                    Minimum Cart Subtotal ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={couponForm.minPurchaseAmount || ''}
                    onChange={(e) =>
                      setCouponForm((prev) => ({
                        ...prev,
                        minPurchaseAmount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0.00 (No minimum)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-xs text-zinc-950 focus:outline-none focus:bg-white focus:border-zinc-950"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                    Max Discount Cap ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    disabled={couponForm.discountType === 'fixed'}
                    value={couponForm.maxDiscountAmount || ''}
                    onChange={(e) =>
                      setCouponForm((prev) => ({
                        ...prev,
                        maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : null,
                      }))
                    }
                    placeholder={
                      couponForm.discountType === 'fixed'
                        ? 'Not applicable for fixed'
                        : 'Optional (e.g. 50.00)'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-xs text-zinc-950 focus:outline-none focus:bg-white focus:border-zinc-950 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Expiration Date & Total Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                    Expiration Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={couponForm.endDate}
                    onChange={(e) =>
                      setCouponForm((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-950 focus:outline-none focus:bg-white focus:border-zinc-950"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                    Total Redemption Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={couponForm.usageLimit || ''}
                    onChange={(e) =>
                      setCouponForm((prev) => ({
                        ...prev,
                        usageLimit: e.target.value ? parseInt(e.target.value, 10) : null,
                      }))
                    }
                    placeholder="Unlimited redemptions"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-xs text-zinc-950 focus:outline-none focus:bg-white focus:border-zinc-950"
                  />
                </div>
              </div>

              {/* Product Catalog Scope */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                    Applicable Catalog Scope
                  </label>
                  <span className="text-[10px] text-zinc-400">
                    {couponForm.applicableProducts && couponForm.applicableProducts.length > 0
                      ? `${couponForm.applicableProducts.length} specific items`
                      : 'All Store Catalog'}
                  </span>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2 max-h-36 overflow-y-auto">
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!couponForm.applicableProducts || couponForm.applicableProducts.length === 0}
                      onChange={() => setCouponForm((prev) => ({ ...prev, applicableProducts: [] }))}
                      className="rounded border-zinc-300 text-zinc-950 focus:ring-0"
                    />
                    <span>All Products in My Store Catalog (Storewide Promo)</span>
                  </label>

                  {products.map((p) => {
                    const isChecked = couponForm.applicableProducts?.includes(p._id);
                    return (
                      <label
                        key={p._id}
                        className="flex items-center gap-2 text-xs text-zinc-700 pl-4 cursor-pointer hover:text-zinc-950"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(isChecked)}
                          onChange={() => {
                            setCouponForm((prev) => {
                              const existing = prev.applicableProducts || [];
                              const next = existing.includes(p._id)
                                ? existing.filter((id) => id !== p._id)
                                : [...existing, p._id];
                              return { ...prev, applicableProducts: next };
                            });
                          }}
                          className="rounded border-zinc-300 text-zinc-950 focus:ring-0"
                        />
                        <span className="truncate">{p.title} (${p.price.toFixed(2)})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCoupon}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs transition-transform active:scale-[0.98] cursor-pointer"
                >
                  {submittingCoupon ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Coupon...</span>
                    </>
                  ) : (
                    <span>{editingCouponId ? 'Update Coupon' : 'Publish Promo Code'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
