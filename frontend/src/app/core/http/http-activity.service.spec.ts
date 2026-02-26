import { TestBed } from '@angular/core/testing';
import { HttpActivityService } from './http-activity.service';

describe('HttpActivityService', () => {
  let service: HttpActivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HttpActivityService);
  });

  it('should track pending request count and busy state', () => {
    expect(service.pendingCount()).toBe(0);
    expect(service.isBusy()).toBeFalse();

    service.begin();
    service.begin();

    expect(service.pendingCount()).toBe(2);
    expect(service.isBusy()).toBeTrue();

    service.end();
    expect(service.pendingCount()).toBe(1);

    service.end();
    expect(service.pendingCount()).toBe(0);
    expect(service.isBusy()).toBeFalse();
  });

  it('should not go below zero', () => {
    service.end();
    service.end();

    expect(service.pendingCount()).toBe(0);
    expect(service.isBusy()).toBeFalse();
  });
});
