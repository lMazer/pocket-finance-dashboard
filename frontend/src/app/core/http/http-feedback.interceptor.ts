import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { ToastService } from '../ui/toast.service';
import { HttpActivityService } from './http-activity.service';

export const httpFeedbackInterceptor: HttpInterceptorFn = (req, next) => {
  const activity = inject(HttpActivityService);
  const toastService = inject(ToastService);

  activity.begin();

  return next(req).pipe(
    tap({
      error: (error: unknown) => {
        if (!(error instanceof HttpErrorResponse)) {
          toastService.error('Erro inesperado de comunicacao.');
          return;
        }

        if (error.status === 0) {
          toastService.error('Nao foi possivel conectar ao backend.');
          return;
        }

        if (error.status === 401) {
          return;
        }

        if (req.method === 'GET' && error.status < 500) {
          return;
        }

        const message = resolveApiErrorMessage(error) ?? `Falha HTTP ${error.status}.`;
        toastService.error(message);
      }
    }),
    finalize(() => activity.end())
  );
};

function resolveApiErrorMessage(error: HttpErrorResponse): string | null {
  const candidate = error.error as { message?: unknown } | null;
  return typeof candidate?.message === 'string' ? candidate.message : null;
}
