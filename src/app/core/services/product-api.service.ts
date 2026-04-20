import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import type { PaginatedList } from '../models/pagination.model';
import type { ProductDetail, ProductListItem } from '../models/product.model';
import type {
  CreateProductRequest,
  CreateVariantRequest,
  GetProductsQuery,
  UpdateProductRequest
} from '../models/product-requests.model';
import type { Category } from '../models/category.model';
import type { ProductVariant } from '../models/product-variant.model';
import type { AdjustInventoryRequest, Inventory, ReserveInventoryRequest } from '../models/inventory.model';
import { EnvironmentService } from './environment.service';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(EnvironmentService);

  getCategories() {
    const params = new HttpParams()
      .set('includeDeleted', 'false')
      .set('asTree', 'false');
    return this.http.get<Category[]>(`${this.env.apiUrl}/categories`, { params });
  }

  getProducts(q: GetProductsQuery) {
    let params = new HttpParams()
      .set('page', String(q.page ?? 1))
      .set('numberOfItems', String(q.numberOfItems ?? 20))
      .set('sortBy', q.sortBy ?? 'updatedAt')
      .set('sortDescending', String(q.sortDescending ?? true));
    if (q.categoryId) {
      params = params.set('categoryId', q.categoryId);
    }
    if (q.status) {
      params = params.set('status', q.status);
    }
    if (q.brand) {
      params = params.set('brand', q.brand);
    }
    if (q.search) {
      params = params.set('search', q.search);
    }
    return this.http.get<PaginatedList<ProductListItem>>(`${this.env.apiUrl}/products`, { params });
  }

  getProduct(id: string) {
    return this.http.get<ProductDetail>(`${this.env.apiUrl}/products/${id}`);
  }

  createProduct(body: CreateProductRequest) {
    return this.http.post<ProductDetail>(`${this.env.apiUrl}/products`, body);
  }

  updateProduct(id: string, body: UpdateProductRequest) {
    return this.http.patch<void>(`${this.env.apiUrl}/products/${id}`, body, { observe: 'response' });
  }

  deleteProduct(id: string) {
    return this.http.delete<void>(`${this.env.apiUrl}/products/${id}`);
  }

  publishProduct(id: string) {
    return this.http.post<void>(`${this.env.apiUrl}/products/${id}:publish`, {}, { observe: 'response' });
  }

  archiveProduct(id: string) {
    return this.http.post<void>(`${this.env.apiUrl}/products/${id}:archive`, {}, { observe: 'response' });
  }

  createVariant(productId: string, body: CreateVariantRequest) {
    return this.http.post<ProductVariant>(`${this.env.apiUrl}/products/${productId}/variants`, body);
  }

  getInventory(variantId: string) {
    return this.http.get<Inventory>(`${this.env.apiUrl}/variants/${variantId}/inventory`);
  }

  reserveInventory(variantId: string, body: ReserveInventoryRequest) {
    return this.http.post<Inventory>(`${this.env.apiUrl}/variants/${variantId}/inventory:reserve`, body);
  }

  adjustInventory(variantId: string, body: AdjustInventoryRequest) {
    const headers = new HttpHeaders({
      'Idempotency-Key': crypto.randomUUID()
    });
    return this.http.post<Inventory>(`${this.env.apiUrl}/variants/${variantId}/inventory:adjust`, body, {
      headers
    });
  }
}
