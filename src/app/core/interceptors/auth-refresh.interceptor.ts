import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Set on retried requests so we only attempt one refresh per original call. */
export const AUTH_REFRESH_RETRIED = new HttpContextToken<boolean>(() => false);

function isAuthEndpoint(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/auth/refresh');
}

/**
 * Must be registered **after** other interceptors so its `next()` reaches `HttpBackend` directly.
 * On 401, refreshes tokens once and retries the request with a new Bearer token.
 */
export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  if (isAuthEndpoint(req.url) || req.context.get(AUTH_REFRESH_RETRIED)) {
    return next(req);
  }
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) {
        return throwError(() => err);
      }
      const auth = inject(AuthService);
      return auth.refreshTokens().pipe(
        switchMap(() => {
          const token = auth.token();
          if (!token) {
            return throwError(() => err);
          }
          return next(
            req.clone({
              headers: req.headers.set('Authorization', `Bearer ${token}`),
              context: req.context.set(AUTH_REFRESH_RETRIED, true)
            })
          );
        }),
        catchError(() => throwError(() => err))
      );
    })
  );
};
