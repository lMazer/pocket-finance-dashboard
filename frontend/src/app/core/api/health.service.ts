import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface ApiHealthResponse {
  status: string;
}

@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getHealth(): Observable<ApiHealthResponse> {
    return this.http.get<ApiHealthResponse>(`${this.apiBaseUrl}/actuator/health`);
  }
}