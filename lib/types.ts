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

export interface ProductCardProps {
  id: number;
  name: string;
  price: number | null;
  image_1: string | null;
  image_2: string | null;
  image_3: string | null;
  brand_name?: string;
}

export interface ProductBrand {
  id: number;
  name: string;
}

export interface ProductResponse {
  subBrands: ProductBrand[] | null;
  colors: string[];
  products: ProductCardProps[];
  page: PageInfo;
}

export interface ProductInformationResponse {
  brandInfo: Brand;
  productInfo: Product;
  relatedProducts: Product[];
}

export interface BrandInfoFeaturedProps {
  id: string;
  logo_url: string;
}

export interface FeaturedResponse {
  brandInfo?: BrandInfoFeaturedProps;
  products: ProductCardProps[];
}

export interface FiltersParams {
  page: string | null;
  color: string | null;
  gender: string | null;
  name: string | null;
  brand: string | null;
  sub_category: string | null;
  sub_brand: string | null;
}

export interface BaseEmailProps {
  name: string;
  email: string;
  message: string;
}

export interface SendEmailProps extends BaseEmailProps {
  to: string;
}
