import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  message: string;
  variant: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private id = 0;
  readonly messages = signal<ToastMessage[]>([]);

  success(message: string): void {
    this.push(message, 'success');
  }

  error(message: string): void {
    this.push(message, 'error');
  }

  info(message: string): void {
    this.push(message, 'info');
  }

  dismiss(id: number): void {
    this.messages.update((list) => list.filter((t) => t.id !== id));
  }

  private push(message: string, variant: ToastMessage['variant']): void {
    const id = ++this.id;
    this.messages.update((list) => [...list, { id, message, variant }]);
    setTimeout(() => this.dismiss(id), 5000);
  }
}
