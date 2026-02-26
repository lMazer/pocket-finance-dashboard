import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should add messages with incrementing ids and kinds', () => {
    service.success('ok');
    service.error('fail');
    service.info('info');

    expect(service.messages().length).toBe(3);
    expect(service.messages()[0]).toEqual(jasmine.objectContaining({ id: 1, kind: 'success', message: 'ok' }));
    expect(service.messages()[1]).toEqual(jasmine.objectContaining({ id: 2, kind: 'error', message: 'fail' }));
    expect(service.messages()[2]).toEqual(jasmine.objectContaining({ id: 3, kind: 'info', message: 'info' }));
  });

  it('should dismiss message manually', () => {
    service.success('ok');
    const [message] = service.messages();

    service.dismiss(message.id);

    expect(service.messages()).toEqual([]);
  });

  it('should auto-dismiss messages after timeout', fakeAsync(() => {
    service.info('temporary');
    expect(service.messages().length).toBe(1);

    tick(4_199);
    expect(service.messages().length).toBe(1);

    tick(1);
    expect(service.messages()).toEqual([]);
  }));
});
