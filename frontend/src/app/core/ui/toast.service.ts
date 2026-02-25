import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  kind: 'error' | 'success' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly state = signal<ToastMessage[]>([]);
  private nextId = 1;

  readonly messages = this.state.asReadonly();

  error(message: string): void {
    this.push('error', message);
  }

  success(message: string): void {
    this.push('success', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  dismiss(id: number): void {
    this.state.update((items) => items.filter((item) => item.id !== id));
  }

  private push(kind: ToastMessage['kind'], message: string): void {
    const id = this.nextId++;
    this.state.update((items) => [...items, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), 4200);
  }
}
