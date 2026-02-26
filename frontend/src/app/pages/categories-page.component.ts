import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriesService } from '../core/api/categories.service';
import { Category } from '../core/api/finance.models';
import { ToastService } from '../core/ui/toast.service';
import { StateEmptyComponent } from '../shared/state/state-empty.component';
import { StateErrorComponent } from '../shared/state/state-error.component';
import { StateLoadingComponent } from '../shared/state/state-loading.component';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StateEmptyComponent, StateErrorComponent, StateLoadingComponent],
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.css'
})
export class CategoriesPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);
  private readonly toastService = inject(ToastService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly isDeletingId = signal<string | null>(null);
  protected readonly editingCategoryId = signal<string | null>(null);

  protected readonly categoryForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    color: ['#52d6a5', [Validators.required, Validators.maxLength(20)]]
  });

  constructor() {
    this.loadCategories();
  }

  protected submit(): void {
    this.loadError.set(null);
    this.categoryForm.markAllAsTouched();

    if (this.categoryForm.invalid || this.isSaving()) {
      return;
    }

    const payload = this.categoryForm.getRawValue();
    const editingId = this.editingCategoryId();
    this.isSaving.set(true);

    const request$ = editingId
      ? this.categoriesService.update(editingId, payload)
      : this.categoriesService.create(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (category) => {
        this.isSaving.set(false);
        if (editingId) {
          this.categories.update((items) => items.map((item) => (item.id === editingId ? category : item)));
          this.toastService.success('Categoria atualizada.');
        } else {
          this.categories.update((items) => [...items, category].sort((a, b) => a.name.localeCompare(b.name)));
          this.toastService.success('Categoria criada.');
        }
        this.resetForm();
      },
      error: (error) => {
        this.isSaving.set(false);
        this.loadError.set(this.resolveErrorMessage(error, 'Nao foi possivel salvar a categoria.'));
      }
    });
  }

  protected edit(category: Category): void {
    this.editingCategoryId.set(category.id);
    this.categoryForm.setValue({
      name: category.name,
      color: category.color
    });
  }

  protected cancelEdit(): void {
    this.resetForm();
  }

  protected delete(category: Category): void {
    if (this.isDeletingId()) {
      return;
    }

    const confirmed = window.confirm(`Excluir a categoria \"${category.name}\"?`);
    if (!confirmed) {
      return;
    }

    this.isDeletingId.set(category.id);
    this.categoriesService
      .delete(category.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeletingId.set(null);
          this.categories.update((items) => items.filter((item) => item.id !== category.id));
          if (this.editingCategoryId() === category.id) {
            this.resetForm();
          }
          this.toastService.success('Categoria excluida.');
        },
        error: (error) => {
          this.isDeletingId.set(null);
          this.loadError.set(this.resolveErrorMessage(error, 'Nao foi possivel excluir a categoria.'));
        }
      });
  }

  protected trackByCategoryId = (_: number, category: Category) => category.id;

  private loadCategories(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.categoriesService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.loadError.set(this.resolveErrorMessage(error, 'Nao foi possivel carregar categorias.'));
          this.isLoading.set(false);
        }
      });
  }

  private resetForm(): void {
    this.editingCategoryId.set(null);
    this.categoryForm.reset({ name: '', color: '#52d6a5' });
    this.categoryForm.markAsPristine();
    this.categoryForm.markAsUntouched();
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
