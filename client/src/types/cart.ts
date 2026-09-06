export interface CartItem {
  _id?: string;
  productId: string;
  title: string;
  price: number;
  image: string;
  category?: string;
  companyId?: string;
  companyName?: string;
  quantity: number;
  stock?: number;
  variantSummary?: string;
  selectedVariants?: Record<string, string>;
}

export interface Cart {
  _id?: string;
  userId?: string | null;
  guestId?: string | null;
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddToCartPayload {
  productId: string;
  title: string;
  price: number;
  image?: string;
  category?: string;
  companyId?: string;
  companyName?: string;
  quantity?: number;
  stock?: number;
  variantSummary?: string;
  selectedVariants?: Record<string, string>;
}

export interface UpdateCartItemPayload {
  quantity: number;
}
