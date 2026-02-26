import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' }
      ]
    });

    service = TestBed.inject(CategoriesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list categories', async () => {
    const promise = firstValueFrom(service.list());

    const req = httpMock.expectOne('/api/categories');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'c1', name: 'Alimentacao', color: '#00FF00' }]);

    await expectAsync(promise).toBeResolvedTo([{ id: 'c1', name: 'Alimentacao', color: '#00FF00' }]);
  });

  it('should create category', async () => {
    const payload = { name: 'Lazer', color: '#112233' };
    const promise = firstValueFrom(service.create(payload));

    const req = httpMock.expectOne('/api/categories');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 'c2', ...payload });

    await expectAsync(promise).toBeResolvedTo({ id: 'c2', ...payload });
  });

  it('should update and delete category', async () => {
    const updatePromise = firstValueFrom(service.update('c1', { name: 'Mercado', color: '#abcdef' }));

    const updateReq = httpMock.expectOne('/api/categories/c1');
    expect(updateReq.request.method).toBe('PATCH');
    expect(updateReq.request.body).toEqual({ name: 'Mercado', color: '#abcdef' });
    updateReq.flush({ id: 'c1', name: 'Mercado', color: '#abcdef' });

    await expectAsync(updatePromise).toBeResolvedTo({ id: 'c1', name: 'Mercado', color: '#abcdef' });

    const deletePromise = firstValueFrom(service.delete('c1'));
    const deleteReq = httpMock.expectOne('/api/categories/c1');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null);

    await expectAsync(deletePromise).toBeResolved();
  });
});
