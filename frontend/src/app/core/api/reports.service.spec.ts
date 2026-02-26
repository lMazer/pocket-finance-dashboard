import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' }
      ]
    });

    service = TestBed.inject(ReportsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should upload csv file as multipart form data', async () => {
    const file = new File(['date,description,amount,type,category'], 'transactions.csv', {
      type: 'text/csv'
    });

    const requestPromise = firstValueFrom(service.importCsv(file));

    const req = httpMock.expectOne('/api/import/csv');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();

    const body = req.request.body as FormData;
    const sentFile = body.get('file');
    expect(sentFile).toBeTruthy();
    expect((sentFile as File).name).toBe('transactions.csv');

    req.flush({ imported: 3, skipped: 1 });

    await expectAsync(requestPromise).toBeResolvedTo({ imported: 3, skipped: 1 });
  });

  it('should download csv blob with optional query params', async () => {
    const responsePromise = firstValueFrom(
      service.exportCsv({ month: '2026-02', category: 'cat-1' })
    );

    const req = httpMock.expectOne((request) => request.url === '/api/export/csv');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    expect(req.request.params.get('month')).toBe('2026-02');
    expect(req.request.params.get('category')).toBe('cat-1');

    const csvBlob = new Blob(['date,description'], { type: 'text/csv' });
    req.flush(csvBlob, {
      headers: { 'content-type': 'text/csv' },
      status: 200,
      statusText: 'OK'
    });

    const response = await responsePromise;
    expect(response).toEqual(jasmine.any(HttpResponse));
    expect(response.body).toEqual(csvBlob);
  });
});
