import api from './api';

export interface WishlistItem {
  productId: string;
  title: string;
  priceAtAdd: number;
  currentPrice: number;
  image?: string;
  category?: string;
  companyId?: string;
  companyName?: string;
  inStock?: boolean;
  addedAt: string;
  isPriceDropped?: boolean;
  priceDropAmount?: number;
  discountPct?: number;
}

export interface WishlistResponse {
  _id: string;
  userId: string;
  items: WishlistItem[];
  totalItems: number;
  isPublic: boolean;
  shareToken?: string;
}

export const wishlistService = {
  getWishlist: async (): Promise<WishlistResponse> => {
    const res = await api.get('/api/wishlist');
    return res.data?.data || res.data;
  },

  addItemToWishlist: async (product: {
    productId: string;
    title: string;
    price: number;
    image?: string;
    category?: string;
    companyId?: string;
    companyName?: string;
  }): Promise<WishlistResponse> => {
    const res = await api.post('/api/wishlist/items', product);
    return res.data?.data || res.data;
  },

  removeItemFromWishlist: async (productId: string): Promise<WishlistResponse> => {
    const res = await api.delete(`/api/wishlist/items/${productId}`);
    return res.data?.data || res.data;
  },

  moveToCart: async (productId: string): Promise<{ item: WishlistItem; remainingWishlist: WishlistResponse }> => {
    const res = await api.post(`/api/wishlist/items/${productId}/move-to-cart`);
    return res.data?.data || res.data;
  },

  getSharedWishlist: async (shareToken: string): Promise<WishlistResponse> => {
    const res = await api.get(`/api/wishlist/shared/${shareToken}`);
    return res.data?.data || res.data;
  },

  togglePublicShare: async (isPublic: boolean): Promise<WishlistResponse> => {
    const res = await api.put('/api/wishlist/share', { isPublic });
    return res.data?.data || res.data;
  },
};

export default wishlistService;
