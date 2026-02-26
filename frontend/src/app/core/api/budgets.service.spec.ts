import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { BudgetsService } from './budgets.service';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' }
      ]
    });

    service = TestBed.inject(BudgetsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list budgets with optional month filter', async () => {
    const promise = firstValueFrom(service.list('2026-02'));

    const req = httpMock.expectOne('/api/budgets?month=2026-02');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'b1', categoryId: 'c1', categoryName: 'Moradia', month: '2026-02', amount: 1200 }]);

    await expectAsync(promise).toBeResolvedTo([
      { id: 'b1', categoryId: 'c1', categoryName: 'Moradia', month: '2026-02', amount: 1200 }
    ]);
  });

  it('should create and update budgets', async () => {
    const createPayload = { month: '2026-02', categoryId: 'c1', amount: 500 };
    const createPromise = firstValueFrom(service.create(createPayload));

    const createReq = httpMock.expectOne('/api/budgets');
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body).toEqual(createPayload);
    createReq.flush({ id: 'b1', categoryName: 'Lazer', ...createPayload });
    await expectAsync(createPromise).toBeResolvedTo({ id: 'b1', categoryName: 'Lazer', ...createPayload });

    const updatePromise = firstValueFrom(service.update('b1', { amount: 650 }));
    const updateReq = httpMock.expectOne('/api/budgets/b1');
    expect(updateReq.request.method).toBe('PATCH');
    expect(updateReq.request.body).toEqual({ amount: 650 });
    updateReq.flush({ id: 'b1', categoryId: 'c1', categoryName: 'Lazer', month: '2026-02', amount: 650 });
    await expectAsync(updatePromise).toBeResolvedTo({
      id: 'b1',
      categoryId: 'c1',
      categoryName: 'Lazer',
      month: '2026-02',
      amount: 650
    });
  });
});
