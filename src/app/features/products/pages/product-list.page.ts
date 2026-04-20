import { DatePipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  computed,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, merge, Subject, switchMap, tap } from 'rxjs';
import { ProductApiService } from '../../../core/services/product-api.service';
import type { ProductListItem } from '../../../core/models/product.model';
import type { Category } from '../../../core/models/category.model';

@Component({
  standalone: true,
  selector: 'app-product-list-page',
  imports: [RouterLink, ReactiveFormsModule, DatePipe, NgClass],
  template: `
    <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-white">Products</h1>
        <p class="text-sm text-slate-400">Search, filter, and manage catalog</p>
      </div>
      <a
        routerLink="/products/new"
        class="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >New product</a
      >
    </div>

    <div class="mb-4 grid gap-3 md:grid-cols-4">
      <div>
        <label class="mb-1 block text-xs uppercase text-slate-500">Search</label>
        <input class="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" [formControl]="search" placeholder="Title, brand…" />
      </div>
      <div>
        <label class="mb-1 block text-xs uppercase text-slate-500">Category</label>
        <select class="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" [formControl]="categoryId">
          <option value="">All</option>
          @for (c of categories(); track c.categoryId) {
            <option [value]="c.categoryId">{{ c.name }}</option>
          }
        </select>
      </div>
      <div>
        <label class="mb-1 block text-xs uppercase text-slate-500">Status</label>
        <select class="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" [formControl]="status">
          <option value="">All</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-xs uppercase text-slate-500">Sort</label>
        <select class="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" [formControl]="sortBy">
          <option value="updatedAt">Updated</option>
          <option value="createdAt">Created</option>
          <option value="title">Title</option>
        </select>
      </div>
    </div>

    @if (loading()) {
      <div class="space-y-2">
        @for (i of skeletons; track i) {
          <div class="h-12 animate-pulse rounded-md bg-slate-800/80"></div>
        }
      </div>
    } @else if (items().length === 0) {
      <div class="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-12 text-center text-slate-400">
        No products match your filters.
      </div>
    } @else {
      <div class="overflow-hidden rounded-xl border border-slate-800">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-900 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-4 py-3">Title</th>
              <th class="px-4 py-3">Brand</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Updated</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            @for (p of items(); track p.productId) {
              <tr class="border-t border-slate-800 hover:bg-slate-900/60">
                <td class="px-4 py-3 font-medium text-white">{{ p.title }}</td>
                <td class="px-4 py-3 text-slate-300">{{ p.brand ?? '—' }}</td>
                <td class="px-4 py-3">
                  <span
                    class="rounded-full px-2 py-0.5 text-xs"
                    [ngClass]="{
                      'bg-amber-900/50': p.status === 'DRAFT',
                      'bg-emerald-900/50': p.status === 'ACTIVE',
                      'bg-slate-700': p.status === 'ARCHIVED'
                    }"
                    >{{ p.status }}</span
                  >
                </td>
                <td class="px-4 py-3 text-slate-400">{{ p.updatedAt | date: 'medium' }}</td>
                <td class="px-4 py-3 text-right">
                  <a class="text-emerald-400 hover:underline" [routerLink]="['/products', p.productId]">View</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>Total {{ total() }}</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded border border-slate-700 px-3 py-1 hover:bg-slate-800 disabled:opacity-40"
            [disabled]="page() <= 1"
            (click)="goPage(page() - 1)"
          >
            Previous
          </button>
          <span>Page {{ page() }}</span>
          <button
            type="button"
            class="rounded border border-slate-700 px-3 py-1 hover:bg-slate-800 disabled:opacity-40"
            [disabled]="!hasNext()"
            (click)="goPage(page() + 1)"
          >
            Next
          </button>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListPage implements OnInit {
  private readonly api = inject(ProductApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly skeletons = [1, 2, 3, 4, 5];

  readonly categories = signal<Category[]>([]);
  readonly items = signal<ProductListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly loading = signal(true);

  readonly search = new FormControl('', { nonNullable: true });
  readonly categoryId = new FormControl('', { nonNullable: true });
  readonly status = new FormControl('', { nonNullable: true });
  readonly sortBy = new FormControl('updatedAt', { nonNullable: true });
  readonly sortDesc = signal(true);

  private readonly refetch$ = new Subject<void>();

  readonly hasNext = computed(() => this.page() * this.pageSize < this.total());

  ngOnInit(): void {
    this.api
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cats) => this.categories.set(cats));

    const search$ = this.search.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {
        this.page.set(1);
      })
    );
    const filters$ = merge(
      this.categoryId.valueChanges.pipe(distinctUntilChanged()),
      this.status.valueChanges.pipe(distinctUntilChanged()),
      this.sortBy.valueChanges.pipe(distinctUntilChanged())
    ).pipe(tap(() => this.page.set(1)));

    merge(search$, filters$, this.refetch$.pipe(tap(() => {})))
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => {
          this.loading.set(true);
          return this.api.getProducts({
            search: this.search.value || undefined,
            categoryId: this.categoryId.value || undefined,
            status: this.status.value || undefined,
            page: this.page(),
            numberOfItems: this.pageSize,
            sortBy: this.sortBy.value,
            sortDescending: this.sortDesc()
          });
        })
      )
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.totalNumberOfItems);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });

    this.refetch$.next();
  }

  goPage(p: number): void {
    if (p < 1) {
      return;
    }
    if (p > 1 && (p - 1) * this.pageSize >= this.total()) {
      return;
    }
    this.page.set(p);
    this.refetch$.next();
  }
}
