import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, mapTo, shareReplay, switchMap, tap } from 'rxjs/operators';
import { API_BASE_URL } from '../api/api.config';
import { AuthResponse, AuthSession, LoginRequest, MeResponse, RefreshTokenRequest } from './auth.models';

const STORAGE_KEY = 'pocket_finance_auth_session';
const REFRESH_LEAD_TIME_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly sessionState = signal<AuthSession | null>(this.readStoredSession());
  private refreshRequest$: Observable<AuthSession> | null = null;
  private refreshTimerId: number | null = null;

  readonly session = this.sessionState.asReadonly();
  readonly user = computed(() => this.sessionState()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this.sessionState()?.accessToken && !this.isAccessTokenExpired());
  readonly hasSession = computed(() => !!this.sessionState()?.refreshToken);

  constructor() {
    this.scheduleProactiveRefresh();
  }

  login(payload: LoginRequest): Observable<AuthSession> {
    return this.http.post<AuthResponse>(`${this.apiBaseUrl}/auth/login`, payload).pipe(
      map((response) => this.toSession(response)),
      tap((session) => this.setSession(session))
    );
  }

  refreshSession(): Observable<AuthSession> {
    const session = this.sessionState();
    if (!session?.refreshToken) {
      return throwError(() => new Error('Sessao sem refresh token.'));
    }

    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    const payload: RefreshTokenRequest = { refreshToken: session.refreshToken };
    this.refreshRequest$ = this.http.post<AuthResponse>(`${this.apiBaseUrl}/auth/refresh`, payload).pipe(
      map((response) => this.toSession(response)),
      tap((nextSession) => this.setSession(nextSession)),
      finalize(() => {
        this.refreshRequest$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.refreshRequest$;
  }

  logout(): Observable<void> {
    if (!this.sessionState()) {
      return of(void 0);
    }

    return this.http.post<void>(`${this.apiBaseUrl}/auth/logout`, {}).pipe(
      tap(() => this.clearSession()),
      catchError((error) => {
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiBaseUrl}/me`);
  }

  accessToken(): string | null {
    return this.sessionState()?.accessToken ?? null;
  }

  refreshToken(): string | null {
    return this.sessionState()?.refreshToken ?? null;
  }

  isAccessTokenExpired(): boolean {
    const expiresAt = this.sessionState()?.expiresAt;
    if (!expiresAt) {
      return true;
    }

    return expiresAt <= Date.now();
  }

  bootstrapSession(): Observable<void> {
    if (!this.sessionState()) {
      return of(void 0);
    }

    return this.me().pipe(
      tap((me) => this.patchUser(me)),
      mapTo(void 0),
      catchError(() =>
        this.refreshSession().pipe(
          switchMap(() => this.me()),
          tap((me) => this.patchUser(me)),
          mapTo(void 0),
          catchError(() => {
            this.clearSession();
            return of(void 0);
          })
        )
      )
    );
  }

  updateUser(me: MeResponse): void {
    this.patchUser(me);
  }

  clearSession(): void {
    this.clearRefreshTimer();
    this.sessionState.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage access failures in restricted contexts.
    }
  }

  private setSession(session: AuthSession): void {
    this.sessionState.set(session);
    this.scheduleProactiveRefresh();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage access failures in restricted contexts.
    }
  }

  private patchUser(user: MeResponse): void {
    const current = this.sessionState();
    if (!current) {
      return;
    }

    this.setSession({
      ...current,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName
      }
    });
  }

  private toSession(response: AuthResponse): AuthSession {
    return {
      tokenType: response.tokenType,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt: Date.now() + response.expiresIn * 1000,
      user: response.user
    };
  }

  private readStoredSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as AuthSession;
      if (!parsed?.accessToken || !parsed?.refreshToken) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  private scheduleProactiveRefresh(): void {
    this.clearRefreshTimer();

    const session = this.sessionState();
    if (!session?.refreshToken || !session.expiresAt) {
      return;
    }

    const refreshInMs = Math.max(session.expiresAt - Date.now() - REFRESH_LEAD_TIME_MS, 0);
    this.refreshTimerId = globalThis.setTimeout(() => {
      if (!this.sessionState()?.refreshToken) {
        return;
      }

      this.refreshSession().subscribe({
        error: () => this.clearSession()
      });
    }, refreshInMs);
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimerId === null) {
      return;
    }

    globalThis.clearTimeout(this.refreshTimerId);
    this.refreshTimerId = null;
  }
}
