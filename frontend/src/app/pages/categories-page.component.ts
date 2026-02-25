import { Component } from '@angular/core';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.css'
})
export class CategoriesPageComponent {
  protected readonly categories = [
    { name: 'Alimentacao', color: '#52d6a5', type: 'Despesa' },
    { name: 'Moradia', color: '#6eb8ff', type: 'Despesa' },
    { name: 'Renda extra', color: '#ffc46b', type: 'Receita' }
  ] as const;
}