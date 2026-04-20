export interface GetProductsQuery {
  categoryId?: string;
  status?: string;
  brand?: string;
  search?: string;
  page?: number;
  numberOfItems?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface CreateProductRequest {
  categoryId: string;
  title: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
  attributes?: Record<string, unknown> | null;
}

export interface UpdateProductRequest extends CreateProductRequest {
  version: number;
}

export interface CreateVariantRequest {
  sku: string;
  barcode?: string | null;
  size?: string | null;
  color?: string | null;
  priceAmount: number;
  compareAtAmount?: number | null;
  currency: string;
  attributes?: Record<string, unknown> | null;
  initialStock: number;
}
