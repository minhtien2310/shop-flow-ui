import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastStackComponent } from './shared/ui/toast-stack.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastStackComponent],
  template: `<router-outlet /><app-toast-stack />`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {}
