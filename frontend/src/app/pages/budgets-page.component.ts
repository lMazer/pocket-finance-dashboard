import { Component } from '@angular/core';

@Component({
  selector: 'app-budgets-page',
  standalone: true,
  templateUrl: './budgets-page.component.html',
  styleUrl: './budgets-page.component.css'
})
export class BudgetsPageComponent {
  protected readonly budgets = [
    { category: 'Alimentacao', used: 760, limit: 1200 },
    { category: 'Lazer', used: 220, limit: 500 },
    { category: 'Transporte', used: 310, limit: 400 }
  ] as const;
}