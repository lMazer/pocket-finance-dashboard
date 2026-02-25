import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const AUTH_EXCLUDED_PATHS = ['/api/auth/login', '/api/auth/refresh'];
const RETRY_ONCE = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  if (AUTH_EXCLUDED_PATHS.some((path) => req.url.startsWith(path))) {
    return next(req);
  }

  const withAuth = appendToken(req, authService.accessToken());

  return next(withAuth).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || req.context.get(RETRY_ONCE)) {
        return throwError(() => error);
      }

      if (!authService.refreshToken()) {
        authService.clearSession();
        void router.navigateByUrl('/login');
        return throwError(() => error);
      }

      return authService.refreshSession().pipe(
        switchMap(() =>
          next(
            appendToken(
              req.clone({
                context: req.context.set(RETRY_ONCE, true)
              }),
              authService.accessToken()
            )
          )
        ),
        catchError((refreshError) => {
          authService.clearSession();
          void router.navigateByUrl('/login');
          return throwError(() => refreshError);
        })
      );
    })
  );
};

function appendToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) {
    return req;
  }

  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}
