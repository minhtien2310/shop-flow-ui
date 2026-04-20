# shop-flow-ui

Angular **19** standalone SPA for **ShopFlow** product management (list, detail, create/edit, inventory reserve). Uses **TailwindCSS**, **RxJS**, and **signals** for lightweight UI state.

## Requirements

- **Node.js 18.19+** (Angular 19)
- Running **ShopFlow.Api** and PostgreSQL (see repo `README` / `shop-flow-db`)

## Install & run

```bash
cd shop-flow-ui
npm install
npm start
```

App defaults to **`http://localhost:4200`**.

## API & CORS

- Development API base URL: **`src/environments/environment.development.ts`** → `http://localhost:5292/api/v1` (matches `ShopFlow.Api` HTTP port).
- Production build uses `environment.production.ts` (`http://localhost:5000/api/v1` placeholder).

Enable CORS on the ASP.NET API for `http://localhost:4200` (policy allowing origin + credentials if you add cookies later).

## Auth

`POST /api/v1/auth/login` — JWT stored in `localStorage` (`shopflow_access_token`). Attach `Authorization: Bearer` via `authInterceptor`.

Use seed users from `shop-flow-db` sample SQL / root README (e.g. `admin@gmail.com`).

## Structure

```
src/app/
  core/           # models, API, interceptors, auth, toast, detail cache
  features/       # auth, products pages
  layouts/        # shell layout
  shared/ui/      # toast stack
```

## Scripts

| Command   | Action              |
|----------|---------------------|
| `npm start` | `ng serve` :4200 |
| `npm run build` | Production build |

## Notes

- List search uses **300ms debounce** and `switchMap` to drop stale HTTP responses when filters change.
- Product detail **caches** successful `GET` by id (`ProductDetailCacheService`).
- **Reserve** calls `POST .../variants/{id}/inventory:reserve` — **409** surfaces via global error interceptor + toast.
