import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { API_BASE_URL } from './api.config';
import { PageResponse, Transaction, TransactionCreateRequest, TransactionListQuery, TransactionUpdateRequest } from './finance.models';

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  list(query: TransactionListQuery = {}): Observable<PageResponse<Transaction>> {
    let params = new HttpParams();
    if (query.month) {
      params = params.set('month', query.month);
    }
    if (query.category) {
      params = params.set('category', query.category);
    }
    if (query.type) {
      params = params.set('type', query.type);
    }
    if (query.q) {
      params = params.set('q', query.q);
    }
    if (typeof query.page === 'number') {
      params = params.set('page', query.page);
    }

    return this.http.get<PageResponse<Transaction>>(`${this.apiBaseUrl}/transactions`, { params });
  }

  listAll(query: Omit<TransactionListQuery, 'page'> = {}): Observable<Transaction[]> {
    return this.list({ ...query, page: 0 }).pipe(
      switchMap((firstPage) => {
        if (firstPage.totalPages <= 1) {
          return of(firstPage.items);
        }

        const requests = Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
          this.list({ ...query, page: index + 1 })
        );

        return forkJoin(requests).pipe(
          map((pages) => [firstPage, ...pages].flatMap((page) => page.items))
        );
      })
    );
  }

  create(payload: TransactionCreateRequest): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiBaseUrl}/transactions`, payload);
  }

  update(id: string, payload: TransactionUpdateRequest): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.apiBaseUrl}/transactions/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/transactions/${id}`);
  }
}
