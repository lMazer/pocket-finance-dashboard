import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { API_BASE_URL } from '../api/api.config';
import { AuthResponse, AuthSession, LoginRequest, MeResponse } from './auth.models';

const STORAGE_KEY = 'pocket_finance_auth_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly sessionState = signal<AuthSession | null>(this.readStoredSession());

  readonly session = this.sessionState.asReadonly();
  readonly user = computed(() => this.sessionState()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this.sessionState()?.accessToken);

  login(payload: LoginRequest): Observable<AuthSession> {
    return this.http.post<AuthResponse>(`${this.apiBaseUrl}/auth/login`, payload).pipe(
      map((response) => this.toSession(response)),
      tap((session) => this.setSession(session))
    );
  }

  logout(): Observable<void> {
    if (!this.sessionState()) {
      return of(void 0);
    }

    return this.http.post<void>(`${this.apiBaseUrl}/auth/logout`, {}).pipe(
      tap(() => this.clearSession())
    );
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiBaseUrl}/me`);
  }

  accessToken(): string | null {
    return this.sessionState()?.accessToken ?? null;
  }

  clearSession(): void {
    this.sessionState.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage access failures in restricted contexts.
    }
  }

  private setSession(session: AuthSession): void {
    this.sessionState.set(session);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage access failures in restricted contexts.
    }
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

      if (typeof parsed.expiresAt === 'number' && parsed.expiresAt <= Date.now()) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }
}
