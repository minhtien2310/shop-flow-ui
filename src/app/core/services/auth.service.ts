import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, finalize, shareReplay, tap, throwError } from 'rxjs';
import type { AuthResponse, LoginRequest, RefreshTokenRequest } from '../models/auth.model';
import { EnvironmentService } from './environment.service';

const TOKEN_KEY = 'shopflow_access_token';
const REFRESH_KEY = 'shopflow_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(EnvironmentService);
  private readonly router = inject(Router);

  private readonly accessToken = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  /** Single in-flight refresh so parallel 401s share one POST /auth/refresh. */
  private refreshInFlight$: Observable<AuthResponse> | null = null;

  readonly isAuthenticated = computed(() => !!this.accessToken());

  token(): string | null {
    return this.accessToken();
  }

  login(body: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.env.apiUrl}/auth/login`, body).pipe(
      tap((res: AuthResponse) => this.persistAuthResponse(res))
    );
  }

  /**
   * Exchanges refresh token for new tokens. Concurrent callers share the same HTTP request.
   */
  refreshTokens(): Observable<AuthResponse> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }
    const body: RefreshTokenRequest = { refreshToken };
    this.refreshInFlight$ = this.http
      .post<AuthResponse>(`${this.env.apiUrl}/auth/refresh`, body)
      .pipe(
        tap((res: AuthResponse) => this.persistAuthResponse(res)),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    return this.refreshInFlight$;
  }

  private persistAuthResponse(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    this.accessToken.set(res.accessToken);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.accessToken.set(null);
    void this.router.navigateByUrl('/login');
  }
}
