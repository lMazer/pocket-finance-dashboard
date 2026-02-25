import { Component } from '@angular/core';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  templateUrl: './transactions-page.component.html',
  styleUrl: './transactions-page.component.css'
})
export class TransactionsPageComponent {
  protected readonly tableRows = [
    { date: '25/02/2026', description: 'Supermercado', category: 'Alimentacao', amount: '-324,90' },
    { date: '24/02/2026', description: 'Freelance', category: 'Renda extra', amount: '+1200,00' },
    { date: '23/02/2026', description: 'Internet', category: 'Moradia', amount: '-119,90' }
  ] as const;
}