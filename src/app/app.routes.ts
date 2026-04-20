import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage) },
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'products' },
      {
        path: 'products',
        loadComponent: () => import('./features/products/pages/product-list.page').then((m) => m.ProductListPage)
      },
      {
        path: 'products/new',
        loadComponent: () => import('./features/products/pages/product-edit.page').then((m) => m.ProductEditPage),
        data: { mode: 'create' as const }
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./features/products/pages/product-detail.page').then((m) => m.ProductDetailPage)
      },
      {
        path: 'products/:id/edit',
        loadComponent: () => import('./features/products/pages/product-edit.page').then((m) => m.ProductEditPage),
        data: { mode: 'edit' as const }
      }
    ]
  },
  { path: '**', redirectTo: 'products' }
];
