import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { Category, CategoryCreateRequest, CategoryUpdateRequest } from './finance.models';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  list(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiBaseUrl}/categories`);
  }

  create(payload: CategoryCreateRequest): Observable<Category> {
    return this.http.post<Category>(`${this.apiBaseUrl}/categories`, payload);
  }

  update(id: string, payload: CategoryUpdateRequest): Observable<Category> {
    return this.http.patch<Category>(`${this.apiBaseUrl}/categories/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/categories/${id}`);
  }
}
