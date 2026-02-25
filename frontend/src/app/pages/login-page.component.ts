import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { ApiErrorResponse } from '../core/auth/auth.models';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css'
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['demo@pocket.local', [Validators.required, Validators.email]],
    password: ['demo123', [Validators.required]]
  });

  protected submit(): void {
    this.submitError.set(null);
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        void this.router.navigateByUrl('/dashboard');
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.submitError.set(this.resolveErrorMessage(error));
      }
    });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiError = error.error as Partial<ApiErrorResponse> | null;
      if (apiError?.message && typeof apiError.message === 'string') {
        return apiError.message;
      }
      return error.status === 0 ? 'Nao foi possivel conectar ao backend.' : 'Falha ao autenticar.';
    }

    return 'Erro inesperado ao autenticar.';
  }
}
