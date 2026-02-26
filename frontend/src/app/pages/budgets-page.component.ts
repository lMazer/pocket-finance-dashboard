import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BudgetsService } from '../core/api/budgets.service';
import { CategoriesService } from '../core/api/categories.service';
import { Budget, Category, Transaction } from '../core/api/finance.models';
import { TransactionsService } from '../core/api/transactions.service';
import { ToastService } from '../core/ui/toast.service';

@Component({
  selector: 'app-budgets-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './budgets-page.component.html',
  styleUrl: './budgets-page.component.css'
})
export class BudgetsPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly budgetsService = inject(BudgetsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly transactionsService = inject(TransactionsService);
  private readonly toastService = inject(ToastService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly budgets = signal<Budget[]>([]);
  protected readonly expenseUsageByCategoryId = signal<Record<string, number>>({});
  protected readonly draftAmounts = signal<Record<string, number>>({});
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly createFormError = signal<string | null>(null);
  protected readonly draftErrorsByBudgetId = signal<Record<string, string>>({});
  protected readonly isCreating = signal(false);
  protected readonly savingBudgetId = signal<string | null>(null);

  protected readonly monthForm = this.formBuilder.nonNullable.group({
    month: [this.currentMonthRef(), [Validators.required]]
  });

  protected readonly createBudgetForm = this.formBuilder.nonNullable.group({
    categoryId: ['', [Validators.required]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]]
  });

  constructor() {
    this.restoreMonthFromUrl();
    this.loadData();
  }

  protected reload(): void {
    this.loadData();
  }

  protected previousMonth(): void {
    this.shiftMonth(-1);
  }

  protected nextMonth(): void {
    this.shiftMonth(1);
  }

  protected currentMonth(): void {
    this.monthForm.controls.month.setValue(this.currentMonthRef());
    this.loadData();
  }

  protected createBudget(): void {
    this.createBudgetForm.markAllAsTouched();
    this.loadError.set(null);
    this.createFormError.set(null);

    if (this.createBudgetForm.invalid || this.isCreating()) {
      this.createFormError.set('Selecione uma categoria e informe um valor maior que zero.');
      return;
    }

    if (!this.availableCategories().length) {
      this.createFormError.set('Todas as categorias ja possuem meta neste mes.');
      return;
    }

    this.isCreating.set(true);
    const raw = this.createBudgetForm.getRawValue();
    this.budgetsService
      .create({
        month: this.monthForm.controls.month.value,
        categoryId: raw.categoryId,
        amount: Number(raw.amount)
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isCreating.set(false);
          this.createFormError.set(null);
          this.toastService.success('Meta criada.');
          this.createBudgetForm.reset({ categoryId: '', amount: null });
          this.loadData();
        },
        error: (error) => {
          this.isCreating.set(false);
          this.loadError.set(this.resolveErrorMessage(error, 'Nao foi possivel criar a meta.'));
        }
      });
  }

  protected onDraftAmountInput(budgetId: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.draftAmounts.update((drafts) => ({ ...drafts, [budgetId]: Number.isFinite(value) ? value : 0 }));
    this.draftErrorsByBudgetId.update((errors) => {
      if (!errors[budgetId]) {
        return errors;
      }
      const next = { ...errors };
      delete next[budgetId];
      return next;
    });
  }

  protected saveBudget(budget: Budget): void {
    if (this.savingBudgetId()) {
      return;
    }

    const nextAmount = this.draftAmounts()[budget.id];
    if (!nextAmount || nextAmount <= 0) {
      this.draftErrorsByBudgetId.update((errors) => ({
        ...errors,
        [budget.id]: 'Informe um valor maior que zero.'
      }));
      return;
    }

    this.savingBudgetId.set(budget.id);
    this.budgetsService
      .update(budget.id, { amount: Number(nextAmount) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.savingBudgetId.set(null);
          this.draftErrorsByBudgetId.update((errors) => {
            if (!errors[updated.id]) {
              return errors;
            }
            const next = { ...errors };
            delete next[updated.id];
            return next;
          });
          this.budgets.update((items) => items.map((item) => (item.id === updated.id ? updated : item)));
          this.draftAmounts.update((drafts) => ({ ...drafts, [updated.id]: Number(updated.amount) }));
          this.toastService.success('Meta atualizada.');
        },
        error: (error) => {
          this.savingBudgetId.set(null);
          this.loadError.set(this.resolveErrorMessage(error, 'Nao foi possivel atualizar a meta.'));
        }
      });
  }

  protected budgetUsage(categoryId: string): number {
    return this.expenseUsageByCategoryId()[categoryId] ?? 0;
  }

  protected budgetProgressPercent(budget: Budget): number {
    const amount = Number(budget.amount) || 0;
    if (amount <= 0) {
      return 0;
    }
    return Math.min(100, (this.budgetUsage(budget.categoryId) / amount) * 100);
  }

  protected budgetIsWarn(budget: Budget): boolean {
    const amount = Number(budget.amount) || 0;
    if (amount <= 0) {
      return false;
    }
    return this.budgetUsage(budget.categoryId) / amount > 0.8;
  }

  protected budgetIsExceeded(budget: Budget): boolean {
    const amount = Number(budget.amount) || 0;
    if (amount <= 0) {
      return false;
    }
    return this.budgetUsage(budget.categoryId) > amount;
  }

  protected budgetStatusText(budget: Budget): string {
    const amount = Number(budget.amount) || 0;
    if (amount <= 0) {
      return 'Meta sem valor valido.';
    }

    const ratio = this.budgetUsage(budget.categoryId) / amount;
    if (ratio > 1) {
      return 'Meta excedida';
    }
    if (ratio > 0.8) {
      return 'Proximo do limite';
    }
    return 'Dentro da meta';
  }

  protected draftError(budgetId: string): string | null {
    return this.draftErrorsByBudgetId()[budgetId] ?? null;
  }

  protected availableCategories(): Category[] {
    const usedIds = new Set(this.budgets().map((budget) => budget.categoryId));
    return this.categories().filter((category) => !usedIds.has(category.id));
  }

  protected totalBudget(): number {
    return this.budgets().reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }

  protected totalUsed(): number {
    return Object.values(this.expenseUsageByCategoryId()).reduce((sum, value) => sum + value, 0);
  }

  protected trackByBudgetId = (_: number, budget: Budget) => budget.id;

  private loadData(): void {
    const month = this.monthForm.controls.month.value;
    this.isLoading.set(true);
    this.loadError.set(null);
    this.syncMonthToUrl();

    forkJoin({
      categories: this.categoriesService.list(),
      budgets: this.budgetsService.list(month),
      expenses: this.transactionsService.listAll({ month, type: 'EXPENSE' })
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ categories, budgets, expenses }) => {
          this.categories.set(categories);
          this.budgets.set(budgets);
          this.expenseUsageByCategoryId.set(this.groupExpenseUsage(expenses));
          this.draftAmounts.set(
            Object.fromEntries(budgets.map((budget) => [budget.id, Number(budget.amount)]))
          );
          this.isLoading.set(false);
        },
        error: (error) => {
          this.loadError.set(this.resolveErrorMessage(error, 'Nao foi possivel carregar metas.'));
          this.isLoading.set(false);
        }
      });
  }

  private groupExpenseUsage(transactions: Transaction[]): Record<string, number> {
    return transactions.reduce<Record<string, number>>((acc, tx) => {
      const amount = Number(tx.amount || 0);
      acc[tx.categoryId] = (acc[tx.categoryId] ?? 0) + amount;
      return acc;
    }, {});
  }

  private currentMonthRef(): string {
    return new Date().toISOString().slice(0, 7);
  }

  private restoreMonthFromUrl(): void {
    const month = this.route.snapshot.queryParamMap.get('month');
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      this.monthForm.controls.month.setValue(month);
    }
  }

  private syncMonthToUrl(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        month: this.monthForm.controls.month.value || null
      },
      queryParamsHandling: 'merge'
    });
  }

  private shiftMonth(delta: number): void {
    const [yearString, monthString] = this.monthForm.controls.month.value.split('-');
    const year = Number(yearString);
    const month = Number(monthString);
    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      return;
    }

    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    const nextMonthRef = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`;
    this.monthForm.controls.month.setValue(nextMonthRef);
    this.loadData();
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const apiError = error.error as { message?: unknown } | null;
      if (typeof apiError?.message === 'string') {
        return apiError.message;
      }
      if (error.status === 0) {
        return 'Backend indisponivel.';
      }
    }
    return fallback;
  }
}
