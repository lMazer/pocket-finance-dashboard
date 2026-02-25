import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

const AUTH_EXCLUDED_PATHS = ['/api/auth/login', '/api/auth/refresh'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  if (AUTH_EXCLUDED_PATHS.some((path) => req.url.startsWith(path))) {
    return next(req);
  }

  const token = inject(AuthService).accessToken();
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  );
};
