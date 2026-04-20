import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 class="mb-6 text-2xl font-semibold text-white">Sign in</h1>
      <form class="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <label class="mb-1 block text-sm text-slate-400">Email</label>
          <input
            class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            type="email"
            formControlName="email"
            autocomplete="username"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm text-slate-400">Password</label>
          <input
            class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            type="password"
            formControlName="password"
            autocomplete="current-password"
          />
        </div>
        @if (busy()) {
          <p class="text-sm text-slate-400">Signing in…</p>
        }
        <button
          type="submit"
          class="w-full rounded-md bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          [disabled]="form.invalid || busy()"
        >
          Continue
        </button>
      </form>
      <p class="mt-4 text-center text-xs text-slate-500">
        Use seed users from <code class="text-slate-400">shop-flow-db</code> README after running sample SQL.
      </p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly busy = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.busy.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.toast.success('Signed in');
        void this.router.navigateByUrl('/products');
        this.busy.set(false);
      },
      error: () => {
        this.toast.error('Invalid email or password');
        this.busy.set(false);
      }
    });
  }
}
