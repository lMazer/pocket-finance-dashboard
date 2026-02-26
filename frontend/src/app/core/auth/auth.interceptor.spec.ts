import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthSession } from './auth.models';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'accessToken',
      'refreshToken',
      'refreshSession',
      'clearSession'
    ]);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    routerSpy.navigateByUrl.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach bearer token to /api requests', () => {
    authServiceSpy.accessToken.and.returnValue('access-1');

    http.get('/api/me').subscribe();

    const req = httpMock.expectOne('/api/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
    req.flush({ ok: true });
  });

  it('should not attach token to login endpoint', () => {
    authServiceSpy.accessToken.and.returnValue('access-1');

    http.post('/api/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ ok: true });
  });

  it('should refresh and retry once on 401', () => {
    authServiceSpy.accessToken.and.returnValues('expired-access', 'fresh-access');
    authServiceSpy.refreshToken.and.returnValue('refresh-1');
    authServiceSpy.refreshSession.and.returnValue(
      of({
        tokenType: 'Bearer',
        accessToken: 'fresh-access',
        refreshToken: 'refresh-2',
        expiresAt: Date.now() + 60_000,
        user: { id: 'u1', email: 'demo@pocket.local', fullName: 'Demo User' }
      } satisfies AuthSession)
    );

    let responseBody: unknown;
    http.get('/api/me').subscribe((response) => {
      responseBody = response;
    });

    const first = httpMock.expectOne('/api/me');
    expect(first.request.headers.get('Authorization')).toBe('Bearer expired-access');
    first.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.refreshSession).toHaveBeenCalledTimes(1);

    const retry = httpMock.expectOne('/api/me');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer fresh-access');
    retry.flush({ id: 'u1' });

    expect(responseBody).toEqual({ id: 'u1' });
  });

  it('should clear session and redirect when 401 occurs without refresh token', () => {
    authServiceSpy.accessToken.and.returnValue('expired-access');
    authServiceSpy.refreshToken.and.returnValue(null);

    let receivedError: HttpErrorResponse | null = null;
    http.get('/api/me').subscribe({
      error: (error) => {
        receivedError = error;
      }
    });

    const first = httpMock.expectOne('/api/me');
    first.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.clearSession).toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(receivedError).not.toBeNull();
    expect((receivedError as unknown as HttpErrorResponse).status).toBe(401);
  });
});
