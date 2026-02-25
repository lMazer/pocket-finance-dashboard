import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HttpActivityService {
  private readonly activeRequests = signal(0);

  readonly pendingCount = this.activeRequests.asReadonly();
  readonly isBusy = computed(() => this.activeRequests() > 0);

  begin(): void {
    this.activeRequests.update((count) => count + 1);
  }

  end(): void {
    this.activeRequests.update((count) => Math.max(0, count - 1));
  }
}
