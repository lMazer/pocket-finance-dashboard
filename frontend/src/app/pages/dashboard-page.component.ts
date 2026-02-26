import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { BudgetsService } from '../core/api/budgets.service';
import { HealthService } from '../core/api/health.service';
import { Budget, Transaction } from '../core/api/finance.models';
import { TransactionsService } from '../core/api/transactions.service';
import { StateEmptyComponent } from '../shared/state/state-empty.component';
import { StateErrorComponent } from '../shared/state/state-error.component';
import { StateLoadingComponent } from '../shared/state/state-loading.component';

type HealthState = 'loading' | 'ok' | 'error';

interface DashboardHighlight {
  label: string;
  value: number;
  tone: 'positive' | 'negative' | 'neutral';
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, StateEmptyComponent, StateErrorComponent, StateLoadingComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css'
})
export class DashboardPageComponent {
  private readonly healthService = inject(HealthService);
  private readonly transactionsService = inject(TransactionsService);
  private readonly budgetsService = inject(BudgetsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly apiHealthState = signal<HealthState>('loading');
  protected readonly apiHealthLabel = signal('Verificando backend...');
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly highlights = signal<DashboardHighlight[]>([]);
  protected readonly recentTransactions = signal<Transaction[]>([]);
  protected readonly budgetSummary = signal<{ total: number; spent: number; coverage: number } | null>(null);

  constructor() {
    this.loadDashboard();
  }

  protected reload(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    const month = this.currentMonthRef();
    this.isLoading.set(true);
    this.loadError.set(null);

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

    forkJoin({
      transactions: this.transactionsService.listAll({ month }),
      budgets: this.budgetsService.list(month)
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ transactions, budgets }) => {
          const income = transactions
            .filter((tx) => tx.type === 'INCOME')
            .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
          const expense = transactions
            .filter((tx) => tx.type === 'EXPENSE')
            .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

          this.highlights.set([
            { label: 'Receitas (mes)', value: income, tone: 'positive' },
            { label: 'Despesas (mes)', value: expense, tone: 'negative' },
            { label: 'Saldo do mes', value: income - expense, tone: 'neutral' }
          ]);

          this.recentTransactions.set(this.sortRecent(transactions).slice(0, 5));
          this.budgetSummary.set(this.computeBudgetSummary(budgets, transactions));
          this.isLoading.set(false);
        },
        error: () => {
          this.loadError.set('Nao foi possivel carregar os dados do dashboard.');
          this.isLoading.set(false);
        }
      });
  }

  private computeBudgetSummary(budgets: Budget[], transactions: Transaction[]): { total: number; spent: number; coverage: number } | null {
    if (!budgets.length) {
      return null;
    }

    const spentByCategory = transactions
      .filter((tx) => tx.type === 'EXPENSE')
      .reduce<Record<string, number>>((acc, tx) => {
        acc[tx.categoryId] = (acc[tx.categoryId] ?? 0) + Number(tx.amount || 0);
        return acc;
      }, {});

    const total = budgets.reduce((sum, budget) => sum + Number(budget.amount || 0), 0);
    const spent = budgets.reduce((sum, budget) => sum + (spentByCategory[budget.categoryId] ?? 0), 0);
    const coverage = total > 0 ? Math.min(100, (spent / total) * 100) : 0;
    return { total, spent, coverage };
  }

  private sortRecent(items: Transaction[]): Transaction[] {
    return [...items].sort((a, b) => {
      const aTime = new Date(`${a.date}T00:00:00`).getTime();
      const bTime = new Date(`${b.date}T00:00:00`).getTime();
      if (aTime !== bTime) {
        return bTime - aTime;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  private currentMonthRef(): string {
    return new Date().toISOString().slice(0, 7);
  }
}
