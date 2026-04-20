import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex min-h-screen flex-col">
      <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <a routerLink="/products" class="text-lg font-semibold tracking-tight text-white">ShopFlow</a>
          <nav class="flex items-center gap-4 text-sm">
            <a
              routerLink="/products"
              routerLinkActive="text-emerald-400"
              [routerLinkActiveOptions]="{ exact: true }"
              class="text-slate-300 hover:text-white"
              >Products</a
            >
            <a routerLink="/products/new" class="text-slate-300 hover:text-white">New product</a>
            <button
              type="button"
              class="rounded-md border border-slate-600 px-3 py-1 text-slate-200 hover:bg-slate-800"
              (click)="auth.logout()"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <router-outlet />
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {
  readonly auth = inject(AuthService);
}
