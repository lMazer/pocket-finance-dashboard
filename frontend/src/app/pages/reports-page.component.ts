import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CategoriesService } from '../core/api/categories.service';
import { Category, CsvImportResponse } from '../core/api/finance.models';
import { ReportsService } from '../core/api/reports.service';
import { ToastService } from '../core/ui/toast.service';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.css'
})
export class ReportsPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);
  private readonly reportsService = inject(ReportsService);
  private readonly toastService = inject(ToastService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly isLoadingCategories = signal(true);
  protected readonly isImporting = signal(false);
  protected readonly isExporting = signal(false);
  protected readonly pageError = signal<string | null>(null);
  protected readonly lastImportResult = signal<CsvImportResponse | null>(null);

  protected readonly exportForm = this.formBuilder.nonNullable.group({
    month: [this.currentMonthRef()],
    category: ['']
  });

  constructor() {
    this.loadCategories();
  }

  protected downloadTemplate(): void {
    const template = [
      'date,description,amount,type,category',
      '2026-02-26,Supermercado,123.45,expense,Alimentacao',
      '2026-02-27,Salario,3500.00,income,Renda'
    ].join('\n');

    this.downloadBlob(new Blob([template], { type: 'text/csv;charset=utf-8' }), 'transactions-template.csv');
    this.toastService.info('Modelo CSV baixado.');
  }

  protected importCsv(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    if (!file || this.isImporting()) {
      if (input) {
        input.value = '';
      }
      return;
    }

    this.pageError.set(null);
    this.isImporting.set(true);
    this.reportsService
      .importCsv(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.isImporting.set(false);
          this.lastImportResult.set(result);
          this.toastService.success(`Importacao concluida: ${result.imported} importadas, ${result.skipped} ignoradas.`);
          this.loadCategories();
          if (input) {
            input.value = '';
          }
        },
        error: (error) => {
          this.isImporting.set(false);
          this.pageError.set(this.resolveErrorMessage(error, 'Nao foi possivel importar o CSV.'));
          if (input) {
            input.value = '';
          }
        }
      });
  }

  protected exportCsv(): void {
    if (this.isExporting()) {
      return;
    }

    const filters = this.exportForm.getRawValue();
    this.pageError.set(null);
    this.isExporting.set(true);
    this.reportsService
      .exportCsv({
        month: filters.month || null,
        category: filters.category || null
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isExporting.set(false);
          const filename = this.resolveDownloadFilename(response.headers.get('content-disposition'), filters.month || null);
          this.downloadBlob(response.body ?? new Blob([], { type: 'text/csv' }), filename);
          this.toastService.success('CSV exportado com sucesso.');
        },
        error: (error) => {
          this.isExporting.set(false);
          this.pageError.set(this.resolveErrorMessage(error, 'Nao foi possivel exportar o CSV.'));
        }
      });
  }

  protected reloadCategories(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.categoriesService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
          this.isLoadingCategories.set(false);
        },
        error: (error) => {
          this.pageError.set(this.resolveErrorMessage(error, 'Nao foi possivel carregar categorias.'));
          this.isLoadingCategories.set(false);
        }
      });
  }

  private currentMonthRef(): string {
    return new Date().toISOString().slice(0, 7);
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

  private resolveDownloadFilename(contentDisposition: string | null, month: string | null): string {
    const match = contentDisposition?.match(/filename=\"?([^\";]+)\"?/i);
    if (match?.[1]) {
      return match[1];
    }
    return month ? `transactions-${month}.csv` : 'transactions.csv';
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }
}
