import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistService, WishlistItem, WishlistResponse } from '../services/wishlistService';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

interface WishlistContextType {
  wishlist: WishlistResponse | null;
  items: WishlistItem[];
  wishlistCount: number;
  priceDropCount: number;
  isWishlistOpen: boolean;
  loading: boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
  toggleWishlistDrawer: () => void;
  addToWishlist: (product: {
    _id?: string;
    productId?: string;
    title: string;
    price: number;
    image?: string;
    category?: string;
    companyId?: string;
    companyName?: string;
  }) => Promise<void>;
  addItem: (product: any) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (product: {
    _id?: string;
    productId?: string;
    title: string;
    price: number;
    image?: string;
    category?: string;
    companyId?: string;
    companyName?: string;
  }) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  moveToCartAndNotify: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState<WishlistResponse | null>(null);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
    if (!user || user.role === 'company') {
      setWishlist(null);
      return;
    }
    try {
      setLoading(true);
      const data = await wishlistService.getWishlist();
      setWishlist(data);
    } catch (err) {
      console.warn('[WishlistContext] Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const openWishlist = () => setIsWishlistOpen(true);
  const closeWishlist = () => setIsWishlistOpen(false);
  const toggleWishlistDrawer = () => setIsWishlistOpen((prev) => !prev);

  const isInWishlist = (productId: string) => {
    if (!wishlist?.items) return false;
    return wishlist.items.some((item) => String(item.productId) === String(productId));
  };

  const addToWishlist = async (product: {
    _id?: string;
    productId?: string;
    title: string;
    price: number;
    image?: string;
    category?: string;
    companyId?: string;
    companyName?: string;
  }) => {
    const prodId = product.productId || product._id;
    if (!prodId) return;

    try {
      const updated = await wishlistService.addItemToWishlist({
        productId: prodId,
        title: product.title,
        price: product.price,
        image: product.image,
        category: product.category,
        companyId: product.companyId,
        companyName: product.companyName,
      });
      setWishlist(updated);
    } catch (err) {
      console.error('[WishlistContext] Add item failed:', err);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const updated = await wishlistService.removeItemFromWishlist(productId);
      setWishlist(updated);
    } catch (err) {
      console.error('[WishlistContext] Remove item failed:', err);
    }
  };

  const toggleWishlist = async (product: {
    _id?: string;
    productId?: string;
    title: string;
    price: number;
    image?: string;
    category?: string;
    companyId?: string;
    companyName?: string;
  }) => {
    const prodId = product.productId || product._id;
    if (!prodId) return;

    if (isInWishlist(prodId)) {
      await removeFromWishlist(prodId);
    } else {
      await addToWishlist(product);
    }
  };

  const moveToCartAndNotify = async (productId: string) => {
    try {
      const result = await wishlistService.moveToCart(productId);
      if (result.item) {
        addToCart({
          productId: result.item.productId,
          title: result.item.title,
          price: result.item.currentPrice || result.item.priceAtAdd,
          image: result.item.image || '',
          quantity: 1,
          category: result.item.category || 'general',
          stock: 99,
        });
      }
      setWishlist(result.remainingWishlist);
    } catch (err) {
      console.error('[WishlistContext] Move to cart failed:', err);
    }
  };

  const items = wishlist?.items || [];
  const wishlistCount = items.length;
  const priceDropCount = items.filter((i) => i.isPriceDropped).length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        items,
        wishlistCount,
        priceDropCount,
        isWishlistOpen,
        loading,
        openWishlist,
        closeWishlist,
        toggleWishlistDrawer,
        addToWishlist,
        addItem: addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        moveToCartAndNotify,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;
