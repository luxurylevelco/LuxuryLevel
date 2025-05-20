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
}

export interface Brand {
  id: number;
  name: string;
  description: string | null;
  logo_url: string | null;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  parent_id?: number | null;
}

export interface PaginatedProductsResponse {
  products: Product[];
  page: {
    current: number;
    total: number;
  };
}
