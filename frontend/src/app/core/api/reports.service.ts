import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { CsvExportQuery, CsvImportResponse } from './finance.models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  importCsv(file: File): Observable<CsvImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<CsvImportResponse>(`${this.apiBaseUrl}/import/csv`, formData);
  }

  exportCsv(query: CsvExportQuery = {}): Observable<HttpResponse<Blob>> {
    let params = new HttpParams();
    if (query.month) {
      params = params.set('month', query.month);
    }
    if (query.category) {
      params = params.set('category', query.category);
    }

    return this.http.get(`${this.apiBaseUrl}/export/csv`, {
      params,
      observe: 'response',
      responseType: 'blob'
    });
  }
}
