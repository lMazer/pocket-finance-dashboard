import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CategoriesService } from '../core/api/categories.service';
import { Category, PageResponse, Transaction, TransactionType } from '../core/api/finance.models';
import { TransactionsService } from '../core/api/transactions.service';
import { ToastService } from '../core/ui/toast.service';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transactions-page.component.html',
  styleUrl: './transactions-page.component.css'
})
export class TransactionsPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);
  private readonly transactionsService = inject(TransactionsService);
  private readonly toastService = inject(ToastService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly pageData = signal<PageResponse<Transaction> | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly isDeletingId = signal<string | null>(null);
  protected readonly editingTransactionId = signal<string | null>(null);

  protected readonly transactionTypes: Array<{ value: TransactionType; label: string }> = [
    { value: 'EXPENSE', label: 'Despesa' },
    { value: 'INCOME', label: 'Receita' }
  ];

  protected readonly filterForm = this.formBuilder.nonNullable.group({
    month: [this.currentMonthRef()],
    category: [''],
    type: [''],
    q: ['']
  });

  protected readonly transactionForm = this.formBuilder.nonNullable.group({
    categoryId: ['', [Validators.required]],
    type: ['EXPENSE' as TransactionType, [Validators.required]],
    description: ['', [Validators.required, Validators.maxLength(255)]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    date: [this.todayDate(), [Validators.required]]
  });

  constructor() {
    this.bootstrap();
  }

  protected applyFilters(): void {
    this.loadTransactions(0);
  }

  protected clearFilters(): void {
    this.filterForm.setValue({ month: this.currentMonthRef(), category: '', type: '', q: '' });
    this.loadTransactions(0);
  }

  protected submit(): void {
    this.transactionForm.markAllAsTouched();
    this.loadError.set(null);

    if (this.transactionForm.invalid || this.isSaving()) {
      return;
    }

    const raw = this.transactionForm.getRawValue();
    const payload = {
      categoryId: raw.categoryId,
      type: raw.type,
      description: raw.description.trim(),
      amount: Number(raw.amount),
      date: raw.date
    };

    this.isSaving.set(true);
    const editingId = this.editingTransactionId();
    const request$ = editingId
      ? this.transactionsService.update(editingId, payload)
      : this.transactionsService.create(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.success(editingId ? 'Transacao atualizada.' : 'Transacao criada.');
        this.resetTransactionForm();
        this.loadTransactions(editingId ? this.currentPage() : 0);
      },
      error: (error) => {
        this.isSaving.set(false);
        this.loadError.set(this.resolveErrorMessage(error, 'Nao foi possivel salvar a transacao.'));
      }
    });
  }

  protected edit(transaction: Transaction): void {
    this.editingTransactionId.set(transaction.id);
    this.transactionForm.setValue({
      categoryId: transaction.categoryId,
      type: transaction.type,
      description: transaction.description,
      amount: Number(transaction.amount),
      date: transaction.date
    });
  }

  protected cancelEdit(): void {
    this.resetTransactionForm();
  }

  protected delete(transaction: Transaction): void {
    if (this.isDeletingId()) {
      return;
    }

    if (!window.confirm(`Excluir a transacao \"${transaction.description}\"?`)) {
      return;
    }

    this.isDeletingId.set(transaction.id);
    this.transactionsService
      .delete(transaction.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeletingId.set(null);
          this.toastService.success('Transacao excluida.');
          this.loadTransactions(this.currentPage());
        },
        error: (error) => {
          this.isDeletingId.set(null);
          this.loadError.set(this.resolveErrorMessage(error, 'Nao foi possivel excluir a transacao.'));
        }
      });
  }

  protected previousPage(): void {
    const page = this.currentPage();
    if (page > 0) {
      this.loadTransactions(page - 1);
    }
  }

  protected nextPage(): void {
    const pageData = this.pageData();
    if (pageData && !pageData.last) {
      this.loadTransactions(pageData.page + 1);
    }
  }

  protected amountClass(type: TransactionType): string {
    return type === 'INCOME' ? 'table__amount table__amount--positive' : 'table__amount';
  }

  protected trackByTransactionId = (_: number, item: Transaction) => item.id;

  protected currentPage(): number {
    return this.pageData()?.page ?? 0;
  }

  private bootstrap(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    forkJoin({
      categories: this.categoriesService.list(),
      transactions: this.transactionsService.list({ month: this.filterForm.controls.month.value, page: 0 })
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ categories, transactions }) => {
          this.categories.set(categories);
          this.pageData.set(transactions);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.loadError.set(this.resolveErrorMessage(error, 'Nao foi possivel carregar transacoes.'));
          this.isLoading.set(false);
        }
      });
  }

  private loadTransactions(page: number): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    const filters = this.filterForm.getRawValue();

    this.transactionsService
      .list({
        month: filters.month || null,
        category: filters.category || null,
        type: (filters.type || null) as TransactionType | null,
        q: filters.q?.trim() || null,
        page
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.pageData.set(result);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.loadError.set(this.resolveErrorMessage(error, 'Nao foi possivel carregar transacoes.'));
          this.isLoading.set(false);
        }
      });
  }

  private resetTransactionForm(): void {
    this.editingTransactionId.set(null);
    this.transactionForm.reset({
      categoryId: '',
      type: 'EXPENSE',
      description: '',
      amount: null,
      date: this.todayDate()
    });
    this.transactionForm.markAsPristine();
    this.transactionForm.markAsUntouched();
  }

  private currentMonthRef(): string {
    return new Date().toISOString().slice(0, 7);
  }

  private todayDate(): string {
    return new Date().toISOString().slice(0, 10);
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
