import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-stack',
  standalone: true,
  template: `
    <div class="pointer-events-none fixed bottom-4 right-4 z-50 flex w-96 max-w-[90vw] flex-col gap-2">
      @for (t of toast.messages(); track t.id) {
        <div
          class="pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg"
          [class.border-emerald-700]="t.variant === 'success'"
          [class.bg-emerald-950]="t.variant === 'success'"
          [class.border-red-700]="t.variant === 'error'"
          [class.bg-red-950]="t.variant === 'error'"
          [class.border-slate-600]="t.variant === 'info'"
          [class.bg-slate-900]="t.variant === 'info'"
        >
          <div class="flex justify-between gap-2">
            <span>{{ t.message }}</span>
            <button type="button" class="text-slate-400 hover:text-white" (click)="toast.dismiss(t.id)">×</button>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastStackComponent {
  readonly toast = inject(ToastService);
}
