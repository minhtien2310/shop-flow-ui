import { Injectable, signal } from '@angular/core';
import type { ProductDetail } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductDetailCacheService {
  private readonly cache = signal<Map<string, ProductDetail>>(new Map());

  get(productId: string): ProductDetail | undefined {
    return this.cache().get(productId);
  }

  set(productId: string, detail: ProductDetail): void {
    this.cache.update((m) => {
      const next = new Map(m);
      next.set(productId, detail);
      return next;
    });
  }

  invalidate(productId: string): void {
    this.cache.update((m) => {
      const next = new Map(m);
      next.delete(productId);
      return next;
    });
  }

  clear(): void {
    this.cache.set(new Map());
  }
}
