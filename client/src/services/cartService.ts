import api from './api';
import { Cart, AddToCartPayload } from '../types/cart';

const GUEST_CART_KEY = 'novacommerce_guest_cart_id';

export const getGuestCartId = (): string | null => {
  try {
    return localStorage.getItem(GUEST_CART_KEY);
  } catch {
    return null;
  }
};

export const setGuestCartId = (guestId: string) => {
  try {
    if (guestId) {
      localStorage.setItem(GUEST_CART_KEY, guestId);
    }
  } catch {
    // Ignore localStorage errors
  }
};

export const clearGuestCartId = () => {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // Ignore localStorage errors
  }
};

const getCartHeaders = () => {
  const guestId = getGuestCartId();
  return guestId ? { 'x-guest-cart-id': guestId } : {};
};

export const getCartApi = async (): Promise<{
  success: boolean;
  cart: Cart;
  guestId?: string;
}> => {
  const response = await api.get<{
    success: boolean;
    cart: Cart;
    guestId?: string;
  }>('/cart', {
    headers: getCartHeaders(),
  });

  if (response.data.guestId) {
    setGuestCartId(response.data.guestId);
  }

  return response.data;
};

export const addToCartApi = async (
  payload: AddToCartPayload
): Promise<{
  success: boolean;
  message?: string;
  cart: Cart;
  guestId?: string;
}> => {
  const response = await api.post<{
    success: boolean;
    message?: string;
    cart: Cart;
    guestId?: string;
  }>('/cart/items', payload, {
    headers: getCartHeaders(),
  });

  if (response.data.guestId) {
    setGuestCartId(response.data.guestId);
  }

  return response.data;
};

export const updateCartItemApi = async (
  productId: string,
  quantity: number
): Promise<{
  success: boolean;
  message?: string;
  cart: Cart;
  guestId?: string;
}> => {
  const response = await api.put<{
    success: boolean;
    message?: string;
    cart: Cart;
    guestId?: string;
  }>(
    `/cart/items/${productId}`,
    { quantity },
    {
      headers: getCartHeaders(),
    }
  );

  if (response.data.guestId) {
    setGuestCartId(response.data.guestId);
  }

  return response.data;
};

export const removeCartItemApi = async (
  productId: string
): Promise<{
  success: boolean;
  message?: string;
  cart: Cart;
}> => {
  const response = await api.delete<{
    success: boolean;
    message?: string;
    cart: Cart;
  }>(`/cart/items/${productId}`, {
    headers: getCartHeaders(),
  });
  return response.data;
};

export const clearCartApi = async (): Promise<{
  success: boolean;
  message?: string;
  cart: Cart;
}> => {
  clearGuestCartId();
  const response = await api.delete<{
    success: boolean;
    message?: string;
    cart: Cart;
  }>('/cart', {
    headers: getCartHeaders(),
  });
  clearGuestCartId();
  return response.data;
};

export const mergeCartApi = async (
  guestId?: string
): Promise<{
  success: boolean;
  message?: string;
  cart: Cart;
}> => {
  const targetGuestId = guestId || getGuestCartId();
  clearGuestCartId();
  const response = await api.post<{
    success: boolean;
    message?: string;
    cart: Cart;
  }>('/cart/merge', { guestId: targetGuestId });

  clearGuestCartId();
  return response.data;
};
