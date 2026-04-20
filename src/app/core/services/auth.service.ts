import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import type { AuthResponse, LoginRequest } from '../models/auth.model';
import { EnvironmentService } from './environment.service';

const TOKEN_KEY = 'shopflow_access_token';
const REFRESH_KEY = 'shopflow_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(EnvironmentService);
  private readonly router = inject(Router);

  private readonly accessToken = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly isAuthenticated = computed(() => !!this.accessToken());

  token(): string | null {
    return this.accessToken();
  }

  login(body: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.env.apiUrl}/auth/login`, body).pipe(
      tap((res: AuthResponse) => {
        localStorage.setItem(TOKEN_KEY, res.accessToken);
        localStorage.setItem(REFRESH_KEY, res.refreshToken);
        this.accessToken.set(res.accessToken);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.accessToken.set(null);
    void this.router.navigateByUrl('/login');
  }
}
