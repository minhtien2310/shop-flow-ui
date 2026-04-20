import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';

function formatErrors(body: unknown): string {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const entries = Object.entries(body as Record<string, string>);
    if (entries.length) {
      return entries.map(([k, v]) => `${k}: ${v}`).join(' · ');
    }
  }
  if (typeof body === 'string') {
    return body;
  }
  return 'Request failed';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);

  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        toast.error('Session expired. Please sign in again.');
        auth.logout();
      } else if (err.status === 409) {
        toast.error(formatErrors(err.error) || 'Conflict (e.g. inventory).');
      } else if (err.status === 400) {
        toast.error(formatErrors(err.error) || 'Validation error');
      } else if (err.status === 0) {
        toast.error('Network error — is the API running?');
      } else if (err.status >= 500) {
        toast.error('Server error. Try again later.');
      } else {
        toast.error(formatErrors(err.error) || err.message);
      }
      return throwError(() => err);
    })
  );
};
