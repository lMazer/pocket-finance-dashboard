import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' }
      ]
    });

    service = TestBed.inject(TransactionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list transactions with filters and page', async () => {
    const promise = firstValueFrom(
      service.list({
        month: '2026-02',
        category: 'c1',
        type: 'EXPENSE',
        q: 'mercado',
        page: 2
      })
    );

    const req = httpMock.expectOne((request) => request.url === '/api/transactions');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('month')).toBe('2026-02');
    expect(req.request.params.get('category')).toBe('c1');
    expect(req.request.params.get('type')).toBe('EXPENSE');
    expect(req.request.params.get('q')).toBe('mercado');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ items: [], page: 2, size: 20, totalElements: 0, totalPages: 1, last: true });

    await expectAsync(promise).toBeResolvedTo({
      items: [],
      page: 2,
      size: 20,
      totalElements: 0,
      totalPages: 1,
      last: true
    });
  });

  it('should aggregate all pages in listAll', async () => {
    const promise = firstValueFrom(service.listAll({ month: '2026-02', type: 'EXPENSE' }));

    const firstReq = httpMock.expectOne((request) => request.url === '/api/transactions' && request.params.get('page') === '0');
    firstReq.flush({
      items: [buildTransaction('t1')],
      page: 0,
      size: 20,
      totalElements: 3,
      totalPages: 2,
      last: false
    });

    const secondReq = httpMock.expectOne((request) => request.url === '/api/transactions' && request.params.get('page') === '1');
    secondReq.flush({
      items: [buildTransaction('t2'), buildTransaction('t3')],
      page: 1,
      size: 20,
      totalElements: 3,
      totalPages: 2,
      last: true
    });

    await expectAsync(promise).toBeResolvedTo([
      buildTransaction('t1'),
      buildTransaction('t2'),
      buildTransaction('t3')
    ]);
  });

  it('should create update and delete transactions', async () => {
    const createPayload = {
      categoryId: 'c1',
      type: 'EXPENSE' as const,
      description: 'Mercado',
      amount: 100.5,
      date: '2026-02-26'
    };
    const createPromise = firstValueFrom(service.create(createPayload));
    const createReq = httpMock.expectOne('/api/transactions');
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body).toEqual(createPayload);
    createReq.flush({ id: 't1', ...createPayload, categoryName: 'Alimentacao', createdAt: '', updatedAt: '' });
    await expectAsync(createPromise).toBeResolved();

    const updatePromise = firstValueFrom(service.update('t1', { description: 'Mercado 2', amount: 120 }));
    const updateReq = httpMock.expectOne('/api/transactions/t1');
    expect(updateReq.request.method).toBe('PATCH');
    expect(updateReq.request.body).toEqual({ description: 'Mercado 2', amount: 120 });
    updateReq.flush({
      id: 't1',
      categoryId: 'c1',
      categoryName: 'Alimentacao',
      type: 'EXPENSE',
      description: 'Mercado 2',
      amount: 120,
      date: '2026-02-26',
      createdAt: '',
      updatedAt: ''
    });
    await expectAsync(updatePromise).toBeResolved();

    const deletePromise = firstValueFrom(service.delete('t1'));
    const deleteReq = httpMock.expectOne('/api/transactions/t1');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null);
    await expectAsync(deletePromise).toBeResolved();
  });
});

function buildTransaction(id: string) {
  return {
    id,
    categoryId: 'c1',
    categoryName: 'Alimentacao',
    type: 'EXPENSE' as const,
    description: `Tx ${id}`,
    amount: 10,
    date: '2026-02-26',
    createdAt: '2026-02-26T00:00:00Z',
    updatedAt: '2026-02-26T00:00:00Z'
  };
}
