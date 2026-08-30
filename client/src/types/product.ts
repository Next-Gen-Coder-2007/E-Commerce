export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
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
  category: string;
  stock: number;
  image?: string;
}

export interface UpdateProductInput {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  stock?: number;
  image?: string;
  isPublished?: boolean;
}

export interface ProductFilterParams {
  search?: string;
  category?: string;
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

export interface CompanyStats {
  totalProducts: number;
  totalUnits: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}
