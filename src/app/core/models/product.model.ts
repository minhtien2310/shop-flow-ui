import type { ProductVariant } from './product-variant.model';
import type { ProductImage } from './product-image.model';

export interface ProductAttributeMap {
  [key: string]: unknown;
}

export interface ProductListItem {
  productId: string;
  categoryId: string;
  title: string;
  slug: string;
  brand: string | null;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail {
  productId: string;
  categoryId: string;
  title: string;
  slug: string;
  description: string | null;
  brand: string | null;
  status: string;
  attributes: ProductAttributeMap;
  version: number;
  deletedAt: string | null;
  variants: ProductVariant[];
  images: ProductImage[];
}
