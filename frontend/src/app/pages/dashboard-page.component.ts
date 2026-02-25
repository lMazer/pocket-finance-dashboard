import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HealthService } from '../core/api/health.service';

type HealthState = 'loading' | 'ok' | 'error';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css'
})
export class DashboardPageComponent {
  private readonly healthService = inject(HealthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly apiHealthState = signal<HealthState>('loading');
  protected readonly apiHealthLabel = signal('Verificando backend...');

  protected readonly highlights = [
    { label: 'Receitas (mes)', value: 'R$ 12.480', tone: 'positive' },
    { label: 'Despesas (mes)', value: 'R$ 7.930', tone: 'negative' },
    { label: 'Saldo projetado', value: 'R$ 4.550', tone: 'neutral' }
  ] as const;

  protected readonly recentTransactions = [
    { title: 'Supermercado', category: 'Alimentacao', amount: '-R$ 324,90', date: '25/02' },
    { title: 'Freelance', category: 'Renda extra', amount: '+R$ 1.200,00', date: '24/02' },
    { title: 'Internet', category: 'Moradia', amount: '-R$ 119,90', date: '23/02' }
  ] as const;

  constructor() {
    this.healthService
      .getHealth()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.apiHealthState.set('ok');
          this.apiHealthLabel.set(`Backend online (${response.status})`);
        },
        error: () => {
          this.apiHealthState.set('error');
          this.apiHealthLabel.set('Backend indisponivel ou proxy nao configurado');
        }
      });
  }
}