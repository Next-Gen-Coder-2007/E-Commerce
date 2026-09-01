import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { Cart, CartItem, AddToCartPayload } from '../types/cart';
import {
  getCartApi,
  addToCartApi,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
  mergeCartApi,
  getGuestCartId,
} from '../services/cartService';
import { useAuth } from './AuthContext';

interface BusinessModalData {
  actionTitle?: string;
  productTitle?: string;
}

interface CartContextType {
  cart: Cart | null;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  loading: boolean;
  actionLoading: boolean;
  isBusinessModalOpen: boolean;
  businessModalData: BusinessModalData | null;
  openBusinessModal: (data?: BusinessModalData) => void;
  closeBusinessModal: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (payload: AddToCartPayload, openDrawer?: boolean) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [businessModalData, setBusinessModalData] = useState<BusinessModalData | null>(null);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  const openBusinessModal = useCallback((data?: BusinessModalData) => {
    setBusinessModalData(data || null);
    setIsBusinessModalOpen(true);
  }, []);

  const closeBusinessModal = useCallback(() => {
    setIsBusinessModalOpen(false);
    setBusinessModalData(null);
  }, []);

  const fetchCart = useCallback(async () => {
    if (user?.role === 'company') {
      setCart(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await getCartApi();
      if (res.success && res.cart) {
        setCart(res.cart);
      }
    } catch (err) {
      console.warn('[CartContext] Error loading cart:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const handleAuthChangeAndLoad = async () => {
      if (user?.role === 'company') {
        setCart(null);
        setLoading(false);
        prevUserIdRef.current = user._id;
        return;
      }

      const currentUserId = user?._id;
      const guestId = getGuestCartId();

      if (currentUserId && guestId) {
        try {
          const mergeRes = await mergeCartApi(guestId);
          if (mergeRes.success && mergeRes.cart) {
            setCart(mergeRes.cart);
            prevUserIdRef.current = currentUserId;
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('[CartContext] Failed to merge guest cart:', err);
        }
      }

      prevUserIdRef.current = currentUserId;
      await fetchCart();
    };

    handleAuthChangeAndLoad();
  }, [user, fetchCart]);

  const openCart = () => {
    if (user?.role === 'company') {
      openBusinessModal({ actionTitle: 'Shopping Cart' });
      return;
    }
    setIsCartOpen(true);
  };

  const closeCart = () => setIsCartOpen(false);

  const toggleCart = () => {
    if (user?.role === 'company') {
      openBusinessModal({ actionTitle: 'Shopping Cart' });
      return;
    }
    setIsCartOpen((prev) => !prev);
  };

  const addToCart = async (
    payload: AddToCartPayload,
    openDrawer: boolean = true
  ): Promise<boolean> => {
    if (user?.role === 'company') {
      openBusinessModal({
        actionTitle: 'Add to Cart',
        productTitle: payload.title,
      });
      return false;
    }

    try {
      setActionLoading(true);
      const res = await addToCartApi(payload);
      if (res.success && res.cart) {
        setCart(res.cart);
        if (openDrawer) {
          setIsCartOpen(true);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('[CartContext] Error adding to cart:', err);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const updateQuantity = async (
    productId: string,
    quantity: number
  ): Promise<boolean> => {
    if (user?.role === 'company') {
      openBusinessModal({ actionTitle: 'Update Quantity' });
      return false;
    }

    try {
      setActionLoading(true);
      const res = await updateCartItemApi(productId, quantity);
      if (res.success && res.cart) {
        setCart(res.cart);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[CartContext] Error updating cart item quantity:', err);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const removeFromCart = async (productId: string): Promise<boolean> => {
    try {
      setActionLoading(true);
      const res = await removeCartItemApi(productId);
      if (res.success && res.cart) {
        setCart(res.cart);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[CartContext] Error removing item from cart:', err);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const clearCart = async (): Promise<boolean> => {
    try {
      setActionLoading(true);
      const res = await clearCartApi();
      if (res.success && res.cart) {
        setCart(res.cart);
        return true;
      }
      setCart(null);
      return true;
    } catch (err) {
      console.error('[CartContext] Error clearing cart:', err);
      setCart(null);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const items = cart?.items || [];
  const totalItems = cart?.totalItems ?? items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = cart?.subtotal ?? items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        totalItems,
        subtotal,
        isCartOpen,
        loading,
        actionLoading,
        isBusinessModalOpen,
        businessModalData,
        openBusinessModal,
        closeBusinessModal,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
