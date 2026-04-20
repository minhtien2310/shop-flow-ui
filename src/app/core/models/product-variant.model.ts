export interface ProductVariant {
  productVariantId: string;
  productId: string;
  sku: string;
  barcode: string | null;
  size: string | null;
  color: string | null;
  priceAmount: number;
  compareAtAmount: number | null;
  currency: string;
  attributes: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
}
