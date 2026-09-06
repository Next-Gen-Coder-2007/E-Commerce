import React, { useState, useEffect } from 'react';
import { getGatewayBaseUrl } from '../../utils/apiConfig';
import {
  Users,
  Building2,
  Package,
  CreditCard,
  Activity,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Ban,
  UserCheck,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  getAdminUserStatsApi,
  getAdminUsersApi,
  updateUserRoleApi,
  updateUserStatusApi,
  updateMerchantVerificationApi,
  getAdminOrderMetricsApi,
  getAdminAllOrdersApi,
  overrideOrderStatusApi,
  pingMicroservicesHealthApi,
} from '../../services/adminService';
import { getProductsApi } from '../../services/productService';
import { AdminUser, AdminUserStats, AdminOrderMetrics, MicroserviceHealthStatus } from '../../types/admin';
import { Product } from '../../types/product';

type AdminTab = 'overview' | 'users' | 'merchants' | 'products' | 'orders' | 'health';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Stats & Metrics
  const [userStats, setUserStats] = useState<AdminUserStats | null>(null);
  const [orderMetrics, setOrderMetrics] = useState<AdminOrderMetrics | null>(null);
  const [healthStatus, setHealthStatus] = useState<MicroserviceHealthStatus[]>([]);

  // Data lists
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const [productSearch, setProductSearch] = useState('');

  // Status message
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [uStats, oMetrics, health] = await Promise.all([
        getAdminUserStatsApi().catch(() => null),
        getAdminOrderMetricsApi().catch(() => null),
        pingMicroservicesHealthApi().catch(() => []),
      ]);

      if (uStats) setUserStats(uStats);
      if (oMetrics) setOrderMetrics(oMetrics);
      setHealthStatus(health);
    } catch (err: any) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAdminUsersApi({
        search: userSearch || undefined,
        role: userRoleFilter !== 'all' ? userRoleFilter : undefined,
        status: userStatusFilter !== 'all' ? userStatusFilter : undefined,
        limit: 50,
      });
      setUsers(res.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getAdminAllOrdersApi({
        search: orderSearch || undefined,
        status: orderStatusFilter !== 'all' ? orderStatusFilter : undefined,
        limit: 50,
      });
      setOrders(res.orders);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getProductsApi({
        search: productSearch || undefined,
        limit: 50,
      });
      setProducts(res.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'merchants') fetchUsers();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'health') {
      pingMicroservicesHealthApi().then(setHealthStatus);
    }
  }, [activeTab, userRoleFilter, userStatusFilter, orderStatusFilter]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Handlers
  const handleRoleChange = async (userId: string, newRole: 'customer' | 'company' | 'admin') => {
    setActionLoading(userId);
    try {
      await updateUserRoleApi(userId, newRole);
      showToast('success', `Role updated to ${newRole}`);
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'suspended' | 'banned') => {
    setActionLoading(userId);
    try {
      await updateUserStatusApi(userId, newStatus);
      showToast('success', `User status updated to ${newStatus}`);
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMerchantVerification = async (userId: string, isVerified: boolean) => {
    setActionLoading(userId);
    try {
      await updateMerchantVerificationApi(userId, isVerified);
      showToast('success', isVerified ? 'Merchant Store Verified!' : 'Merchant Verification Revoked');
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update verification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOrderStatusOverride = async (orderId: string, newStatus: string) => {
    setActionLoading(orderId);
    try {
      await overrideOrderStatusApi(orderId, newStatus, `Admin override to ${newStatus}`);
      showToast('success', `Order status updated to ${newStatus}`);
      fetchOrders();
      fetchOverviewData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to override order status');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Admin Header */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold text-xl shadow-inner">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-white tracking-tight">NovaCommerce Admin Console</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Super-Admin
                  </span>
                </div>
                <p className="text-xs text-slate-400">Enterprise Platform Governance, Catalog Moderation & Multi-Service Telemetry</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  fetchOverviewData();
                  if (activeTab === 'users' || activeTab === 'merchants') fetchUsers();
                  if (activeTab === 'orders') fetchOrders();
                  if (activeTab === 'products') fetchProducts();
                }}
                disabled={loading}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync Platform</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 sm:gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none border-t border-slate-800/60 pt-3 text-xs font-bold">
            {[
              { id: 'overview', label: 'Overview & KPIs', icon: TrendingUp },
              { id: 'users', label: 'Users & Roles', icon: Users, badge: userStats?.totalUsers },
              { id: 'merchants', label: 'Merchant Approvals', icon: Building2, badge: userStats?.unverifiedCompanies },
              { id: 'products', label: 'Global Catalog', icon: Package },
              { id: 'orders', label: 'Orders & Refunds', icon: CreditCard, badge: orderMetrics?.totalOrders },
              { id: 'health', label: 'System Health', icon: Activity, badge: `${healthStatus.filter(s => s.status === 'healthy').length}/${healthStatus.length || 8}` },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-400'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {statusMessage && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ======================================================== */}
        {/* 1. OVERVIEW & KPIS TAB */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                  <span>Gross Merchandise Value (GMV)</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  ${orderMetrics?.totalGMV ? orderMetrics.totalGMV.toLocaleString() : '0.00'}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-2 font-medium">
                  <span>Avg Order Value:</span>
                  <span className="font-bold">${orderMetrics?.avgOrderValue || '0.00'}</span>
                </div>
              </div>

              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                  <span>Total Users Registered</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  {userStats?.totalUsers || 0}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
                  <span>Customers: <b className="text-slate-200">{userStats?.customerCount || 0}</b></span>
                  <span>•</span>
                  <span>Merchants: <b className="text-slate-200">{userStats?.companyCount || 0}</b></span>
                </div>
              </div>

              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                  <span>Orders Processed</span>
                  <CreditCard className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  {orderMetrics?.totalOrders || 0}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-purple-400 mt-2">
                  <span>Delivered:</span>
                  <span className="font-bold">{orderMetrics?.statusBreakdown.delivered || 0}</span>
                  <span>•</span>
                  <span>Refunded:</span>
                  <span className="font-bold">{orderMetrics?.statusBreakdown.refunded || 0}</span>
                </div>
              </div>

              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                  <span>Microservices Health</span>
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  {healthStatus.length > 0 ? `${healthStatus.filter(s => s.status === 'healthy').length}/${healthStatus.length}` : '8/8'} Online
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold">All clusters operational</span>
                </div>
              </div>
            </div>

            {/* Pipeline Breakdown & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Order Status Breakdown */}
              <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Order Pipeline Distribution</span>
                </h3>
                <div className="space-y-2.5 text-xs">
                  {[
                    { label: 'Pending / Staged', count: orderMetrics?.statusBreakdown.pending || 0, color: 'bg-amber-500' },
                    { label: 'Confirmed (Saga Verified)', count: orderMetrics?.statusBreakdown.confirmed || 0, color: 'bg-indigo-500' },
                    { label: 'Processing by Merchant', count: orderMetrics?.statusBreakdown.processing || 0, color: 'bg-blue-500' },
                    { label: 'Shipped / In Transit', count: orderMetrics?.statusBreakdown.shipped || 0, color: 'bg-purple-500' },
                    { label: 'Delivered', count: orderMetrics?.statusBreakdown.delivered || 0, color: 'bg-emerald-500' },
                    { label: 'Cancelled / Refunded', count: (orderMetrics?.statusBreakdown.cancelled || 0) + (orderMetrics?.statusBreakdown.refunded || 0), color: 'bg-rose-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <span className="text-slate-300 font-medium">{item.label}</span>
                      </div>
                      <span className="font-mono font-bold text-white">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Orders Stream */}
              <div className="lg:col-span-2 p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    <span>Recent Platform Transactions</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 pb-2">
                        <th className="pb-2 font-semibold">Order #</th>
                        <th className="pb-2 font-semibold">Items</th>
                        <th className="pb-2 font-semibold">Total</th>
                        <th className="pb-2 font-semibold">Status</th>
                        <th className="pb-2 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {orderMetrics?.recentOrders && orderMetrics.recentOrders.length > 0 ? (
                        orderMetrics.recentOrders.map((ord) => (
                          <tr key={ord._id} className="hover:bg-slate-800/30">
                            <td className="py-3 font-mono font-bold text-indigo-400">{ord.orderNumber}</td>
                            <td className="py-3 text-slate-300">{ord.orderItems?.length || 0} items</td>
                            <td className="py-3 font-mono font-bold text-white">${ord.pricing?.totalPrice?.toFixed(2)}</td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  ord.orderStatus === 'delivered'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : ord.orderStatus === 'shipped'
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : ord.orderStatus === 'cancelled' || ord.orderStatus === 'refunded'
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : 'bg-indigo-500/20 text-indigo-400'
                                }`}
                              >
                                {ord.orderStatus}
                              </span>
                            </td>
                            <td className="py-3 text-slate-400 text-[11px]">{new Date(ord.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-500">
                            No orders found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. USERS & ROLES TAB */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Search & Filter Strip */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Roles</option>
                  <option value="customer">Customer</option>
                  <option value="company">Merchant / Company</option>
                  <option value="admin">Administrator</option>
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>

                <button
                  onClick={fetchUsers}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Users Data Table */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-3xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold pb-2">
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Merchant Verification</th>
                    <th className="p-3">Joined Date</th>
                    <th className="p-3 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-800/20">
                      <td className="p-3">
                        <div className="font-bold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-indigo-400">
                            {u.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div>{u.name}</div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          disabled={actionLoading === u._id}
                          onChange={(e) => handleRoleChange(u._id, e.target.value as any)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="customer">Customer</option>
                          <option value="company">Merchant</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.status === 'banned'
                              ? 'bg-rose-500/20 text-rose-400'
                              : u.status === 'suspended'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {u.status || 'active'}
                        </span>
                      </td>
                      <td className="p-3">
                        {u.role === 'company' ? (
                          u.isVerifiedCompany ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verified Store</span>
                            </span>
                          ) : (
                            <span className="text-amber-400 text-[11px] font-medium">Pending Review</span>
                          )
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.status === 'banned' ? (
                            <button
                              onClick={() => handleStatusChange(u._id, 'active')}
                              className="px-2.5 py-1 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Unban</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(u._id, 'banned')}
                              className="px-2.5 py-1 bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Ban User</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. MERCHANT APPROVALS TAB */}
        {/* ======================================================== */}
        {activeTab === 'merchants' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Merchant Store Licensing & Verification Queue</span>
                </h3>
                <p className="text-xs text-slate-400">Review business licenses, tax credentials, and grant Official Store badges</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.filter(u => u.role === 'company').map((m) => (
                <div key={m._id} className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-lg">
                        {m.companyName?.charAt(0) || m.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-extrabold text-white text-sm flex items-center gap-1.5">
                          <span>{m.companyName || m.name}</span>
                          {m.isVerifiedCompany && (
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{m.email}</div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        m.isVerifiedCompany ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {m.isVerifiedCompany ? 'Verified Store' : 'Pending License'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Contact Phone:</span>
                      <span className="text-slate-300 font-medium">{m.phone || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Tax ID / License:</span>
                      <span className="text-slate-300 font-mono font-medium">{m.businessDetails?.taxId || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 text-[10px] block">Website:</span>
                      <span className="text-indigo-400">{m.businessDetails?.website || '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      Applied: {new Date(m.createdAt).toLocaleDateString()}
                    </span>

                    {m.isVerifiedCompany ? (
                      <button
                        onClick={() => handleMerchantVerification(m._id, false)}
                        disabled={actionLoading === m._id}
                        className="px-3.5 py-1.5 bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 rounded-xl text-xs font-bold transition"
                      >
                        Revoke License
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMerchantVerification(m._id, true)}
                        disabled={actionLoading === m._id}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Approve Merchant</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. GLOBAL PRODUCTS & MODERATION TAB */}
        {/* ======================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search catalog products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="text-xs text-slate-400">
                Found <b className="text-white">{products.length}</b> total platform products
              </div>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-3xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold pb-2">
                    <th className="p-3">Product</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Stock Available</th>
                    <th className="p-3">Seller Store</th>
                    <th className="p-3 text-right">Storefront Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-800/20">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                            alt={p.title}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-800 border border-slate-700"
                          />
                          <div>
                            <div className="font-bold text-white">{p.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {p._id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400">${p.price.toFixed(2)}</td>
                      <td className="p-3 font-mono text-slate-300">{p.stock} units</td>
                      <td className="p-3 text-slate-400">{p.companyName || 'Platform Vendor'}</td>
                      <td className="p-3 text-right">
                        <a
                          href={`/product/${p._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Item</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. ORDERS & REFUND AUDITS TAB */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search order number or recipient..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Order Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>

                <button
                  onClick={fetchOrders}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
                >
                  Filter
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-3xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold pb-2">
                    <th className="p-3">Order Number</th>
                    <th className="p-3">Recipient</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Current Status</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3 text-right">Admin Status Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-800/20">
                      <td className="p-3 font-mono font-bold text-indigo-400">{o.orderNumber}</td>
                      <td className="p-3">
                        <div className="font-semibold text-white">{o.shippingAddress?.fullName || 'Anonymous'}</div>
                        <div className="text-[10px] text-slate-400">{o.shippingAddress?.phone}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-white">${o.pricing?.totalPrice?.toFixed(2)}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            o.orderStatus === 'delivered'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : o.orderStatus === 'shipped'
                              ? 'bg-purple-500/20 text-purple-400'
                              : o.orderStatus === 'refunded' || o.orderStatus === 'cancelled'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-indigo-500/20 text-indigo-400'
                          }`}
                        >
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        {new Date(o.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <select
                          value={o.orderStatus}
                          disabled={actionLoading === o._id}
                          onChange={(e) => handleOrderStatusOverride(o._id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancel Order</option>
                          <option value="refunded">Force Refund</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. SYSTEM HEALTH & MICROSERVICES TAB */}
        {/* ======================================================== */}
        {activeTab === 'health' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Distributed Microservices Cluster Health & Prometheus Telemetry</span>
                </h3>
                <p className="text-xs text-slate-400">Continuous health pingers checking API Gateway and all domain microservices</p>
              </div>
              <button
                onClick={() => pingMicroservicesHealthApi().then(setHealthStatus)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ping Clusters</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {healthStatus.map((s) => (
                <div key={s.name} className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-sm">{s.name}</span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                      Port :{s.port}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          s.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                        }`}
                      />
                      <span className="font-bold text-slate-200 capitalize">{s.status}</span>
                    </div>
                    <span className="font-mono text-slate-400 text-[11px]">{s.latencyMs}ms</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono">{s.endpoint}</span>
                    <a
                      href={`${getGatewayBaseUrl()}/metrics`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:underline font-bold flex items-center gap-0.5"
                    >
                      <span>/metrics</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
