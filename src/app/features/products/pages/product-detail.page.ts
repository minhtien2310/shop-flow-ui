import { DecimalPipe, JsonPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { ProductApiService } from '../../../core/services/product-api.service';
import { ProductDetailCacheService } from '../../../core/services/product-detail-cache.service';
import type { ProductDetail } from '../../../core/models/product.model';
import type { ProductVariant } from '../../../core/models/product-variant.model';
import type { Inventory } from '../../../core/models/inventory.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-product-detail-page',
  imports: [RouterLink, DecimalPipe, JsonPipe, NgClass],
  template: `
    @if (loading()) {
      <div class="space-y-3">
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="h-10 animate-pulse rounded bg-slate-800"></div>
        }
      </div>
    } @else {
      @if (product(); as p) {
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs uppercase text-slate-500">Product</p>
          <h1 class="text-2xl font-semibold text-white">{{ p.title }}</h1>
          <p class="text-sm text-slate-400">{{ p.status }} · {{ p.brand ?? 'No brand' }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a
            class="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            [routerLink]="['/products', p.productId, 'edit']"
            >Edit</a
          >
          <button
            type="button"
            class="rounded-md border border-amber-700 px-3 py-1.5 text-sm text-amber-200 hover:bg-amber-950/40"
            (click)="publish()"
            [disabled]="busy()"
          >
            Publish
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            (click)="archive()"
            [disabled]="busy()"
          >
            Archive
          </button>
          <button
            type="button"
            class="rounded-md border border-red-800 px-3 py-1.5 text-sm text-red-200 hover:bg-red-950/30"
            (click)="remove()"
            [disabled]="busy()"
          >
            Delete
          </button>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-4">
          <section class="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Images</h2>
            @if (p.images.length === 0) {
              <p class="text-sm text-slate-500">No images</p>
            } @else {
              <div class="flex flex-wrap gap-2">
                @for (img of p.images; track img.productImageId) {
                  <img [src]="img.url" [alt]="img.alt ?? ''" class="h-28 w-28 rounded-lg object-cover ring-1 ring-slate-700" />
                }
              </div>
            }
          </section>
          <section class="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Attributes</h2>
            <pre class="overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-300">{{ p.attributes | json }}</pre>
          </section>
        </div>
        <div class="space-y-4">
          <section class="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Variants</h2>
            <div class="space-y-2">
              @for (v of p.variants; track v.productVariantId) {
                <button
                  type="button"
                  class="w-full rounded-lg border px-3 py-2 text-left text-sm transition"
                  [ngClass]="{
                    'border-emerald-500 bg-emerald-950/30': selected()?.productVariantId === v.productVariantId,
                    'border-slate-700': selected()?.productVariantId !== v.productVariantId
                  }"
                  (click)="selectVariant(v)"
                >
                  <div class="font-medium text-white">{{ v.sku }}</div>
                  <div class="text-xs text-slate-400">{{ v.size ?? '—' }} / {{ v.color ?? '—' }}</div>
                  <div class="text-xs text-emerald-300">{{ v.priceAmount | number }} {{ v.currency }}</div>
                </button>
              }
            </div>
          </section>
          @if (selected(); as v) {
            <section class="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <h2 class="mb-2 text-sm font-semibold uppercase text-slate-400">Stock</h2>
              @if (inventoryLoading()) {
                <p class="text-sm text-slate-500">Loading inventory…</p>
              } @else {
                @if (inventory(); as inv) {
                <p class="text-sm text-slate-300">Available: <strong class="text-white">{{ inv.available }}</strong></p>
                <p class="text-xs text-slate-500">Qty {{ inv.quantity }} · Reserved {{ inv.reserved }}</p>
                <button
                  type="button"
                  class="mt-3 w-full rounded-md bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                  [disabled]="inv.available <= 0 || reserveBusy()"
                  (click)="reserve(v.productVariantId)"
                >
                  Reserve 1 unit
                </button>
                }
              }
            </section>
          }
        </div>
      </div>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ProductApiService);
  private readonly cache = inject(ProductDetailCacheService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly product = signal<ProductDetail | null>(null);
  readonly loading = signal(true);
  readonly selected = signal<ProductVariant | null>(null);
  readonly inventory = signal<Inventory | null>(null);
  readonly inventoryLoading = signal(false);
  readonly reserveBusy = signal(false);
  readonly busy = signal(false);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((p) => p.get('id')!),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
        switchMap((id) => {
          this.loading.set(true);
          const cached = this.cache.get(id);
          return cached ? of(cached) : this.api.getProduct(id);
        })
      )
      .subscribe({
        next: (p) => {
          this.product.set(p);
          this.cache.set(p.productId, p);
          this.loading.set(false);
          const first = p.variants[0] ?? null;
          this.selected.set(first);
          if (first) {
            this.loadInventory(first.productVariantId);
          }
        },
        error: () => this.loading.set(false)
      });
  }

  selectVariant(v: ProductVariant): void {
    this.selected.set(v);
    this.loadInventory(v.productVariantId);
  }

  private loadInventory(variantId: string): void {
    this.inventoryLoading.set(true);
    this.api.getInventory(variantId).subscribe({
      next: (inv) => {
        this.inventory.set(inv);
        this.inventoryLoading.set(false);
      },
      error: () => this.inventoryLoading.set(false)
    });
  }

  reserve(variantId: string): void {
    this.reserveBusy.set(true);
    this.api.reserveInventory(variantId, { quantity: 1, referenceId: `ui-${Date.now()}` }).subscribe({
      next: (inv) => {
        this.inventory.set(inv);
        this.toast.success('Reserved 1 unit');
        this.reserveBusy.set(false);
      },
      error: () => this.reserveBusy.set(false)
    });
  }

  publish(): void {
    const p = this.product();
    if (!p) {
      return;
    }
    this.busy.set(true);
    this.api.publishProduct(p.productId).subscribe({
      next: () => {
        this.toast.success('Published');
        this.cache.invalidate(p.productId);
        this.reloadProduct(p.productId);
        this.busy.set(false);
      },
      error: () => this.busy.set(false)
    });
  }

  archive(): void {
    const p = this.product();
    if (!p) {
      return;
    }
    this.busy.set(true);
    this.api.archiveProduct(p.productId).subscribe({
      next: () => {
        this.toast.success('Archived');
        this.cache.invalidate(p.productId);
        this.reloadProduct(p.productId);
        this.busy.set(false);
      },
      error: () => this.busy.set(false)
    });
  }

  remove(): void {
    const p = this.product();
    if (!p || !confirm(`Delete “${p.title}”? This soft-deletes the product.`)) {
      return;
    }
    this.busy.set(true);
    this.api.deleteProduct(p.productId).subscribe({
      next: () => {
        this.toast.success('Product deleted');
        this.cache.invalidate(p.productId);
        history.back();
        this.busy.set(false);
      },
      error: () => this.busy.set(false)
    });
  }

  private reloadProduct(id: string): void {
    this.api.getProduct(id).subscribe((detail) => {
      this.product.set(detail);
      this.cache.set(id, detail);
    });
  }
}
