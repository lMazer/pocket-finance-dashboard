import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { AuthResponse } from './auth.models';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should persist session on login', async () => {
    service = TestBed.inject(AuthService);
    const loginPromise = firstValueFrom(service.login({ email: 'demo@pocket.local', password: 'demo123' }));

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(buildAuthResponse({ accessToken: 'access-1', refreshToken: 'refresh-1' }));

    const session = await loginPromise;
    expect(session.accessToken).toBe('access-1');
    expect(service.accessToken()).toBe('access-1');
    expect(service.refreshToken()).toBe('refresh-1');

    const stored = localStorage.getItem('pocket_finance_auth_session');
    expect(stored).toContain('access-1');
    expect(service.hasSession()).toBeTrue();
  });

  it('should bootstrap session by refreshing when /me returns 401', async () => {
    localStorage.setItem(
      'pocket_finance_auth_session',
      JSON.stringify({
        tokenType: 'Bearer',
        accessToken: 'expired-access',
        refreshToken: 'refresh-1',
        expiresAt: Date.now() - 1_000,
        user: { id: 'u1', email: 'old@pocket.local', fullName: 'Old Name' }
      })
    );

    service = TestBed.inject(AuthService);

    const bootstrapPromise = firstValueFrom(service.bootstrapSession());

    const meRequest = httpMock.expectOne('/api/me');
    meRequest.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    const refreshRequest = httpMock.expectOne('/api/auth/refresh');
    expect(refreshRequest.request.body).toEqual({ refreshToken: 'refresh-1' });
    refreshRequest.flush(buildAuthResponse({ accessToken: 'access-2', refreshToken: 'refresh-2' }));

    const meRetry = httpMock.expectOne('/api/me');
    meRetry.flush({ id: 'u1', email: 'demo@pocket.local', fullName: 'Demo User' });

    await bootstrapPromise;

    expect(service.accessToken()).toBe('access-2');
    expect(service.refreshToken()).toBe('refresh-2');
    expect(service.user()?.email).toBe('demo@pocket.local');
  });

  it('should refresh proactively before token expiration', fakeAsync(() => {
    service = TestBed.inject(AuthService);
    let loginCompleted = false;
    service.login({ email: 'demo@pocket.local', password: 'demo123' }).subscribe(() => {
      loginCompleted = true;
    });

    httpMock.expectOne('/api/auth/login').flush(
      buildAuthResponse({ accessToken: 'access-1', refreshToken: 'refresh-1', expiresIn: 120 })
    );
    expect(loginCompleted).toBeTrue();

    tick(59_000);
    httpMock.expectNone('/api/auth/refresh');

    tick(1_000);
    const refreshRequest = httpMock.expectOne('/api/auth/refresh');
    refreshRequest.flush(buildAuthResponse({ accessToken: 'access-2', refreshToken: 'refresh-2', expiresIn: 120 }));

    expect(service.accessToken()).toBe('access-2');
    expect(service.refreshToken()).toBe('refresh-2');
    service.clearSession();
  }));
});

function buildAuthResponse(overrides: Partial<AuthResponse> = {}): AuthResponse {
  return {
    tokenType: 'Bearer',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 900,
    user: {
      id: 'u1',
      email: 'demo@pocket.local',
      fullName: 'Demo User'
    },
    ...overrides
  };
}
