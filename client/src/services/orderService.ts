import api from './api';
import {
  CreateOrderPayload,
  OrderDetailResponse,
  OrderListResponse,
  UpdateOrderStatusPayload,
} from '../types/order';

export const createOrderApi = async (
  payload: CreateOrderPayload
): Promise<OrderDetailResponse> => {
  const { data } = await api.post<OrderDetailResponse>('/orders', payload);
  return data;
};

export const getMyOrdersApi = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<OrderListResponse> => {
  const { data } = await api.get<OrderListResponse>('/orders/my-orders', {
    params,
  });
  return data;
};

export const getOrdersApi = getMyOrdersApi;

export const getOrderByIdApi = async (
  idOrOrderNumber: string
): Promise<OrderDetailResponse> => {
  const { data } = await api.get<OrderDetailResponse>(`/orders/${idOrOrderNumber}`);
  return data;
};

export const payOrderApi = async (
  orderId: string,
  payload?: { paymentMethod?: string; transactionId?: string }
): Promise<OrderDetailResponse> => {
  const { data } = await api.put<OrderDetailResponse>(
    `/orders/${orderId}/pay`,
    payload || {}
  );
  return data;
};

export const cancelOrderApi = async (
  orderId: string,
  reason?: string
): Promise<OrderDetailResponse> => {
  const { data } = await api.put<OrderDetailResponse>(`/orders/${orderId}/cancel`, {
    reason,
  });
  return data;
};

export const getCompanyOrdersApi = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<OrderListResponse> => {
  const { data } = await api.get<OrderListResponse>('/orders/company/orders', {
    params,
  });
  return data;
};

export const updateOrderStatusApi = async (
  orderId: string,
  payload: UpdateOrderStatusPayload
): Promise<OrderDetailResponse> => {
  const { data } = await api.put<OrderDetailResponse>(
    `/orders/${orderId}/status`,
    payload
  );
  return data;
};

export const trackOrderApi = async (
  orderNumber: string,
  params?: { postalCode?: string; email?: string }
): Promise<OrderDetailResponse> => {
  const { data } = await api.get<OrderDetailResponse>(
    `/orders/track/${orderNumber}`,
    { params }
  );
  return data;
};

export interface SagaAuditStep {
  step: string;
  status: 'PENDING' | 'STARTED' | 'COMPLETED' | 'FAILED';
  timestamp: string;
  details?: Record<string, any>;
}

export interface SagaCheckoutResponse {
  success: boolean;
  message?: string;
  data: {
    sagaId: string;
    order: any;
    reservationId?: string;
    transactionId?: string;
    auditSteps: SagaAuditStep[];
  };
}

export const checkoutWithSagaApi = async (
  payload: CreateOrderPayload
): Promise<SagaCheckoutResponse> => {
  const { data } = await api.post<SagaCheckoutResponse>('/api/orders/checkout-saga', payload);
  return data;
};

