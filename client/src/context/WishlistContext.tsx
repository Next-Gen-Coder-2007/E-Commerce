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

const GUEST_WISHLIST_KEY = 'novacommerce_guest_wishlist';

const getGuestWishlist = (): WishlistItem[] => {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveGuestWishlist = (items: WishlistItem[]) => {
  try {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('[WishlistContext] Failed to persist guest wishlist:', err);
  }
};

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState<WishlistResponse | null>(null);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
    if (user?.role === 'company') {
      setWishlist(null);
      return;
    }

    // Authenticated user
    if (user) {
      try {
        setLoading(true);
        // Check if there are any guest items to migrate
        const guestItems = getGuestWishlist();
        if (guestItems.length > 0) {
          for (const item of guestItems) {
            try {
              await wishlistService.addItemToWishlist({
                productId: item.productId,
                title: item.title,
                price: item.currentPrice || item.priceAtAdd,
                image: item.image,
                category: item.category,
                companyId: item.companyId,
                companyName: item.companyName,
              });
            } catch {
              // Ignore single item sync failure
            }
          }
          saveGuestWishlist([]);
        }

        const data = await wishlistService.getWishlist();
        setWishlist(data);
      } catch (err) {
        console.warn('[WishlistContext] Failed to load wishlist:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Guest user (unauthenticated) - load from localStorage
    const guestItems = getGuestWishlist();
    setWishlist({
      _id: 'guest_wishlist',
      userId: 'guest',
      items: guestItems,
      totalItems: guestItems.length,
      isPublic: false,
    });
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

    // Handle authenticated user
    if (user) {
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
      return;
    }

    // Handle guest user
    const currentGuestItems = getGuestWishlist();
    if (!currentGuestItems.some((item) => String(item.productId) === String(prodId))) {
      const newItem: WishlistItem = {
        productId: prodId,
        title: product.title,
        priceAtAdd: product.price,
        currentPrice: product.price,
        image: product.image,
        category: product.category,
        companyId: product.companyId,
        companyName: product.companyName,
        addedAt: new Date().toISOString(),
        inStock: true,
      };
      const updatedGuestItems = [newItem, ...currentGuestItems];
      saveGuestWishlist(updatedGuestItems);
      setWishlist({
        _id: 'guest_wishlist',
        userId: 'guest',
        items: updatedGuestItems,
        totalItems: updatedGuestItems.length,
        isPublic: false,
      });
    }
  };

  const removeFromWishlist = async (productId: string) => {
    // Handle authenticated user
    if (user) {
      try {
        const updated = await wishlistService.removeItemFromWishlist(productId);
        setWishlist(updated);
      } catch (err) {
        console.error('[WishlistContext] Remove item failed:', err);
      }
      return;
    }

    // Handle guest user
    const currentGuestItems = getGuestWishlist();
    const updatedGuestItems = currentGuestItems.filter(
      (item) => String(item.productId) !== String(productId)
    );
    saveGuestWishlist(updatedGuestItems);
    setWishlist({
      _id: 'guest_wishlist',
      userId: 'guest',
      items: updatedGuestItems,
      totalItems: updatedGuestItems.length,
      isPublic: false,
    });
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
    // Handle authenticated user
    if (user) {
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
      return;
    }

    // Handle guest user
    const currentGuestItems = getGuestWishlist();
    const targetItem = currentGuestItems.find(
      (item) => String(item.productId) === String(productId)
    );
    if (targetItem) {
      await addToCart({
        productId: targetItem.productId,
        title: targetItem.title,
        price: targetItem.currentPrice || targetItem.priceAtAdd,
        image: targetItem.image || '',
        quantity: 1,
        category: targetItem.category || 'general',
        stock: 99,
      });
      await removeFromWishlist(productId);
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
