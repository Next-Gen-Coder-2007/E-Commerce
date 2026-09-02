export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'customer' | 'company' | 'admin';
  status?: 'active' | 'suspended' | 'banned';
  isBanned?: boolean;
  isVerifiedCompany?: boolean;
  companyName?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  businessDetails?: {
    taxId?: string;
    supportEmail?: string;
    supportPhone?: string;
    website?: string;
    storeDescription?: string;
  };
}

export interface AdminMerchant {
  _id: string;
  name: string;
  email: string;
  companyName?: string;
  companyDescription?: string;
  isVerifiedMerchant?: boolean;
  storeStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface AdminOrder {
  _id: string;
  orderNumber?: string;
  userId?: any;
  totalPrice?: number;
  totalAmount?: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  createdAt: string;
  orderItems?: Array<{ title: string; quantity: number; price: number }>;
  shippingAddress?: any;
}

export interface AdminMetrics {
  totalGmv: number;
  totalOrders: number;
  totalUsers: number;
  activeCompanies: number;
  pendingApprovals: number;
}

export interface AdminUserStats {
  totalUsers: number;
  customerCount: number;
  companyCount: number;
  adminCount: number;
  unverifiedCompanies: number;
  bannedUsers: number;
}

export interface AdminOrderMetrics {
  totalOrders: number;
  totalGMV: number;
  avgOrderValue: number;
  totalDiscount: number;
  statusBreakdown: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    refunded: number;
  };
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    pricing: { totalPrice: number };
    orderStatus: string;
    user?: string;
    createdAt: string;
    orderItems: Array<{ title: string; quantity: number; price: number }>;
  }>;
}

export interface MicroserviceHealthStatus {
  name: string;
  port: number;
  status: 'healthy' | 'degraded' | 'offline';
  latencyMs: number;
  endpoint: string;
  details?: Record<string, any>;
}
