export interface Product {
  id: number;
  ref_no: string | null;
  name: string;
  description: string | null;
  color: string | null;
  gender: string | null;
  stock: number | null;
  price: number | null;
  brand_id: number;
  category_id: number | null;
  image_1: string | null;
  image_2: string | null;
  image_3: string | null;
  created_at: string;
  updated_at: string;
  brand_name?: string;
}

export interface Brand {
  id: number;
  name: string;
  description: string | null;
  logo_url: string | null;
  parent_id: string;
  featured: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  parent_id?: number | null;
}

export interface PaginatedProductsResponse {
  subBrands: Brand[];
  products: Product[];
  page: {
    current: number;
    total: number;
  };
}

export interface PageInfo {
  current: number;
  total: number;
}

export interface BrandResponse {
  brandDetails: Brand;
  products: Product[];
  page: PageInfo;
}

export interface ProductResponse {
  colors: string[];
  products: Product[];
  page: PageInfo;
}

export interface ProductInformationResponse {
  brandInfo: Brand;
  productInfo: Product;
  relatedProducts: Product[];
}
