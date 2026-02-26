import { Component, input } from '@angular/core';

@Component({
  selector: 'app-state-loading',
  standalone: true,
  template: `
    <p class="pf-empty state-loading" role="status" aria-live="polite">
      <span class="state-loading__dot" aria-hidden="true"></span>
      <span>{{ message() }}</span>
    </p>
  `,
  styles: [
    `
      .state-loading {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
      }

      .state-loading__dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 999px;
        background: var(--accent);
        box-shadow: 0 0 0 0 rgba(82, 214, 165, 0.35);
        animation: state-pulse 1000ms ease-out infinite;
      }

      @keyframes state-pulse {
        0% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(82, 214, 165, 0.35);
        }

        100% {
          transform: scale(1.15);
          box-shadow: 0 0 0 8px rgba(82, 214, 165, 0);
        }
      }
    `
  ]
})
export class StateLoadingComponent {
  readonly message = input('Carregando...');
}
