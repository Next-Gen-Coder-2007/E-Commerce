export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod =
  | 'card_upi'
  | 'card'
  | 'upi'
  | 'cod'
  | 'stripe'
  | 'paypal';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type ShippingMethodType = 'standard' | 'express' | 'priority' | 'overnight';

export interface OrderItem {
  _id?: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  companyId?: string;
  companyName?: string;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone: string;
  deliveryNotes?: string;
}

export interface StatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: string;
}

export interface OrderPricing {
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  discountAmount: number;
  couponCode?: string;
  totalPrice: number;
}

export interface FulfillmentInfo {
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
  shippingNotes?: string;
}

export interface CancellationInfo {
  isCancelled: boolean;
  cancelledAt?: string;
  cancelReason?: string;
  cancelledBy?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethodType;
  paymentInfo: PaymentInfo;
  pricing: OrderPricing;
  orderStatus: OrderStatus;
  statusHistory: StatusHistoryItem[];
  fulfillment: FulfillmentInfo;
  cancellation?: CancellationInfo;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  orderItems: Array<{
    productId: string;
    title: string;
    price: number;
    quantity: number;
    image?: string;
    category?: string;
    companyId?: string;
    companyName?: string;
  }>;
  shippingAddress: ShippingAddress;
  shippingMethod?: ShippingMethodType;
  paymentMethod?: PaymentMethod;
  couponCode?: string;
  notes?: string;
}

export interface CompanyOrderStats {
  totalOrders: number;
  totalRevenue: number;
  unitsSold: number;
  pendingFulfillment: number;
  deliveredCount: number;
  cancelledCount: number;
}

export interface OrderListResponse {
  success: boolean;
  orders: Order[];
  page: number;
  pages: number;
  total: number;
  stats?: CompanyOrderStats;
}

export interface OrderDetailResponse {
  success: boolean;
  order: Order;
  message?: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  shippingNotes?: string;
  note?: string;
}
