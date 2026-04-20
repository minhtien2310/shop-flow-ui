export interface Inventory {
  variantId: string;
  quantity: number;
  reserved: number;
  available: number;
  version: number;
  updatedAt: string | null;
}

export interface ReserveInventoryRequest {
  quantity: number;
  referenceId?: string | null;
}

export interface AdjustInventoryRequest {
  delta: number;
  reason: string;
  referenceId?: string | null;
}
