import { Component, input } from '@angular/core';

@Component({
  selector: 'app-state-error',
  standalone: true,
  template: `<p class="pf-inline-error" role="alert">{{ message() }}</p>`
})
export class StateErrorComponent {
  readonly message = input.required<string>();
}
