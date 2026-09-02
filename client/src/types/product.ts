export interface ProductSpecification {
  key: string;
  value: string;
}

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  isFlashSale?: boolean;
  category: string;
  brand?: string;
  stock: number;
  image: string;
  images?: string[];
  specifications?: ProductSpecification[];
  companyId: string;
  companyName: string;
  isPublished: boolean;
  rating: number;
  numReviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  isFlashSale?: boolean;
  category: string;
  brand?: string;
  stock: number;
  image?: string;
  images?: string[];
  specifications?: ProductSpecification[];
}

export interface UpdateProductInput {
  title?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  discountPercentage?: number;
  isFlashSale?: boolean;
  category?: string;
  brand?: string;
  stock?: number;
  image?: string;
  images?: string[];
  specifications?: ProductSpecification[];
  isPublished?: boolean;
}

export interface ProductFilterParams {
  search?: string;
  category?: string;
  brand?: string;
  companyId?: string;
  companyName?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'oldest';
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  products: Product[];
}

export interface StorefrontSettings {
  _id?: string;
  companyId: string;
  companyName: string;
  bannerImage?: string;
  bannerUrl?: string;
  tagline?: string;
  description?: string;
  announcement?: string;
  flashSale?: {
    isActive: boolean;
    title: string;
    description: string;
    discountPercentage: number;
    endsAt: string | null;
  };
}

export interface CompanyStorefrontResponse {
  success: boolean;
  store: {
    companyId: string;
    companyName: string;
    totalProducts: number;
    rating: number;
    numReviews: number;
    categories: string[];
    bannerImage?: string;
    tagline?: string;
    description?: string;
    announcement?: string;
    flashSale?: {
      isActive: boolean;
      title: string;
      description: string;
      discountPercentage: number;
      endsAt: string | null;
    };
  };
  count: number;
  total: number;
  page: number;
  pages: number;
  products: Product[];
}

export interface CompanyStats {
  totalProducts: number;
  totalUnits: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}
