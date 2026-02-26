import { Component, input } from '@angular/core';

@Component({
  selector: 'app-state-empty',
  standalone: true,
  template: `<p class="pf-empty">{{ message() }}</p>`
})
export class StateEmptyComponent {
  readonly message = input.required<string>();
}
