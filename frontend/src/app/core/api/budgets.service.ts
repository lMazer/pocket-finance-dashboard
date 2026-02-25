import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { Budget, BudgetCreateRequest, BudgetUpdateRequest } from './finance.models';

@Injectable({ providedIn: 'root' })
export class BudgetsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  list(month?: string | null): Observable<Budget[]> {
    let params = new HttpParams();
    if (month) {
      params = params.set('month', month);
    }
    return this.http.get<Budget[]>(`${this.apiBaseUrl}/budgets`, { params });
  }

  create(payload: BudgetCreateRequest): Observable<Budget> {
    return this.http.post<Budget>(`${this.apiBaseUrl}/budgets`, payload);
  }

  update(id: string, payload: BudgetUpdateRequest): Observable<Budget> {
    return this.http.patch<Budget>(`${this.apiBaseUrl}/budgets/${id}`, payload);
  }
}
