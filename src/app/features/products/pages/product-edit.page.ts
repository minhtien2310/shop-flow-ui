import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { ProductApiService } from '../../../core/services/product-api.service';
import type { Category } from '../../../core/models/category.model';
import type { CreateVariantRequest } from '../../../core/models/product-requests.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-product-edit-page',
  imports: [ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-3xl">
      <h1 class="mb-6 text-2xl font-semibold text-white">{{ isCreate() ? 'Create product' : 'Edit product' }}</h1>

      <form class="space-y-6 rounded-xl border border-slate-800 bg-slate-900/40 p-6" [formGroup]="form" (ngSubmit)="submit()">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="md:col-span-2">
            <label class="mb-1 block text-sm text-slate-400">Category</label>
            <select class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2" formControlName="categoryId">
              <option value="" disabled>Select…</option>
              @for (c of categories(); track c.categoryId) {
                <option [value]="c.categoryId">{{ c.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm text-slate-400">Title</label>
            <input class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2" formControlName="title" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-slate-400">Slug</label>
            <input class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2" formControlName="slug" />
          </div>
          <div class="md:col-span-2">
            <label class="mb-1 block text-sm text-slate-400">Description</label>
            <textarea class="min-h-[80px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2" formControlName="description"></textarea>
          </div>
          <div>
            <label class="mb-1 block text-sm text-slate-400">Brand</label>
            <input class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2" formControlName="brand" />
          </div>
        </div>

        <section>
          <div class="mb-2 flex items-center justify-between">
            <h2 class="text-sm font-semibold uppercase text-slate-400">Attributes (key / value)</h2>
            <button type="button" class="text-xs text-emerald-400 hover:underline" (click)="addAttr()">+ Add</button>
          </div>
          <div class="space-y-2" formArrayName="attributes">
            @for (row of attributes.controls; track $index; let i = $index) {
              <div class="flex gap-2" [formGroupName]="i">
                <input class="flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm" formControlName="key" placeholder="key" />
                <input class="flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm" formControlName="value" placeholder="value" />
                <button type="button" class="text-slate-500 hover:text-red-400" (click)="removeAttr(i)">✕</button>
              </div>
            }
          </div>
        </section>

        @if (isCreate()) {
          <section>
            <div class="mb-2 flex items-center justify-between">
              <h2 class="text-sm font-semibold uppercase text-slate-400">Variants</h2>
              <button type="button" class="text-xs text-emerald-400 hover:underline" (click)="addVariant()">+ Add variant</button>
            </div>
            <div class="space-y-3" formArrayName="variants">
              @for (v of variants.controls; track $index; let i = $index) {
                <div class="rounded-lg border border-slate-800 p-3" [formGroupName]="i">
                  <div class="grid gap-2 md:grid-cols-2">
                    <input class="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" formControlName="sku" placeholder="SKU *" />
                    <input class="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" formControlName="barcode" placeholder="Barcode" />
                    <input class="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" formControlName="size" placeholder="Size" />
                    <input class="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" formControlName="color" placeholder="Color" />
                    <input type="number" class="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" formControlName="priceAmount" placeholder="Price" />
                    <input type="number" class="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" formControlName="initialStock" placeholder="Initial stock" />
                  </div>
                </div>
              }
            </div>
          </section>
        }

        @if (saving()) {
          <p class="text-sm text-slate-400">Saving…</p>
        }
        <div class="flex gap-3">
          <button
            type="submit"
            class="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            [disabled]="form.invalid || saving()"
          >
            Save
          </button>
          <button type="button" class="rounded-md border border-slate-600 px-4 py-2 text-sm" (click)="cancel()">Cancel</button>
        </div>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductEditPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ProductApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = signal<Category[]>([]);
  readonly isCreate = signal(false);
  readonly saving = signal(false);
  private productId: string | null = null;
  private loadedVersion = 0;

  readonly form = this.fb.group({
    categoryId: ['', Validators.required],
    title: ['', Validators.required],
    slug: ['', Validators.required],
    description: [''],
    brand: [''],
    version: [0],
    attributes: this.fb.array([] as FormGroup[]),
    variants: this.fb.array([] as FormGroup[])
  });

  get attributes(): FormArray {
    return this.form.get('attributes') as FormArray;
  }

  get variants(): FormArray {
    return this.form.get('variants') as FormArray;
  }

  private createAttrRow(): FormGroup {
    return this.fb.group({ key: [''], value: [''] });
  }

  private createVariantRow(): FormGroup {
    return this.fb.group({
      sku: ['', Validators.required],
      barcode: [''],
      size: [''],
      color: [''],
      priceAmount: [0, [Validators.required, Validators.min(1)]],
      initialStock: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    const mode = this.route.snapshot.data['mode'] as 'create' | 'edit' | undefined;
    this.isCreate.set(mode === 'create');
    this.productId = this.route.snapshot.paramMap.get('id');

    this.api
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((c) => this.categories.set(c));

    this.addAttr();
    if (this.isCreate()) {
      this.addVariant();
    } else if (this.productId) {
      this.api
        .getProduct(this.productId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((p) => {
          this.loadedVersion = p.version;
          this.form.patchValue({
            categoryId: p.categoryId,
            title: p.title,
            slug: p.slug,
            description: p.description ?? '',
            brand: p.brand ?? '',
            version: p.version
          });
          this.attributes.clear();
          const attrs = p.attributes as Record<string, unknown>;
          for (const k of Object.keys(attrs)) {
            this.attributes.push(
              this.fb.group({
                key: [k, Validators.required],
                value: [JSON.stringify(attrs[k]), Validators.required]
              })
            );
          }
          if (this.attributes.length === 0) {
            this.addAttr();
          }
        });
    }
  }

  addAttr(): void {
    this.attributes.push(this.createAttrRow());
  }

  removeAttr(i: number): void {
    this.attributes.removeAt(i);
  }

  addVariant(): void {
    this.variants.push(this.createVariantRow());
  }

  cancel(): void {
    void this.router.navigateByUrl('/products');
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    const attrObj: Record<string, unknown> = {};
    for (const row of raw.attributes as { key: string; value: string }[]) {
      if (!row.key?.trim()) {
        continue;
      }
      try {
        attrObj[row.key] = JSON.parse(row.value);
      } catch {
        attrObj[row.key] = row.value;
      }
    }

    this.saving.set(true);
    if (this.isCreate()) {
      this.api
        .createProduct({
          categoryId: raw.categoryId,
          title: raw.title,
          slug: raw.slug,
          description: raw.description || null,
          brand: raw.brand || null,
          attributes: Object.keys(attrObj).length ? attrObj : null
        })
        .pipe(
          switchMap((created) => {
            const vars = (raw.variants ?? []) as {
              sku: string;
              barcode?: string;
              size?: string;
              color?: string;
              priceAmount: number;
              initialStock: number;
            }[];
            if (!vars.length) {
              return of(created);
            }
            const reqs = vars.map((v) => {
              const body: CreateVariantRequest = {
                sku: v.sku,
                barcode: v.barcode || null,
                size: v.size || null,
                color: v.color || null,
                priceAmount: v.priceAmount,
                compareAtAmount: null,
                currency: 'VND',
                attributes: null,
                initialStock: v.initialStock ?? 0
              };
              return this.api.createVariant(created.productId, body);
            });
            return forkJoin(reqs).pipe(map(() => created));
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (created) => {
            this.toast.success('Product created');
            this.saving.set(false);
            void this.router.navigate(['/products', created.productId]);
          },
          error: () => this.saving.set(false)
        });
    } else if (this.productId) {
      this.api
        .updateProduct(this.productId, {
          categoryId: raw.categoryId,
          title: raw.title,
          slug: raw.slug,
          description: raw.description || null,
          brand: raw.brand || null,
          attributes: Object.keys(attrObj).length ? attrObj : null,
          version: this.loadedVersion
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toast.success('Product updated');
            this.saving.set(false);
            void this.router.navigate(['/products', this.productId!]);
          },
          error: () => this.saving.set(false)
        });
    }
  }
}
