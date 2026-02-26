import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpActivityService } from './http-activity.service';
import { httpFeedbackInterceptor } from './http-feedback.interceptor';
import { ToastService } from '../ui/toast.service';

describe('httpFeedbackInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let activitySpy: jasmine.SpyObj<HttpActivityService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    activitySpy = jasmine.createSpyObj<HttpActivityService>('HttpActivityService', ['begin', 'end']);
    toastSpy = jasmine.createSpyObj<ToastService>('ToastService', ['error', 'success', 'info']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpFeedbackInterceptor])),
        provideHttpClientTesting(),
        { provide: HttpActivityService, useValue: activitySpy },
        { provide: ToastService, useValue: toastSpy }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should track request activity on success', () => {
    http.get('/api/ok').subscribe();

    const req = httpMock.expectOne('/api/ok');
    expect(activitySpy.begin).toHaveBeenCalledTimes(1);
    req.flush({ ok: true });

    expect(activitySpy.end).toHaveBeenCalledTimes(1);
    expect(toastSpy.error).not.toHaveBeenCalled();
  });

  it('should show backend connectivity error on status 0', () => {
    http.get('/api/down').subscribe({ error: () => undefined });

    const req = httpMock.expectOne('/api/down');
    req.error(new ProgressEvent('error'));

    expect(toastSpy.error).toHaveBeenCalledWith('Nao foi possivel conectar ao backend.');
    expect(activitySpy.end).toHaveBeenCalledTimes(1);
  });

  it('should suppress toast for GET client errors and 401', () => {
    http.get('/api/not-found').subscribe({ error: () => undefined });
    http.get('/api/me').subscribe({ error: () => undefined });

    const notFoundReq = httpMock.expectOne('/api/not-found');
    notFoundReq.flush({ message: 'Nao encontrado' }, { status: 404, statusText: 'Not Found' });

    const unauthorizedReq = httpMock.expectOne('/api/me');
    unauthorizedReq.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(toastSpy.error).not.toHaveBeenCalled();
    expect(activitySpy.end).toHaveBeenCalledTimes(2);
  });

  it('should show API message for non-GET HTTP errors', () => {
    http.post('/api/transactions', {}).subscribe({ error: () => undefined });

    const req = httpMock.expectOne('/api/transactions');
    req.flush({ message: 'Falha de validacao' }, { status: 400, statusText: 'Bad Request' });

    expect(toastSpy.error).toHaveBeenCalledWith('Falha de validacao');
    expect(activitySpy.end).toHaveBeenCalledTimes(1);
  });
});
