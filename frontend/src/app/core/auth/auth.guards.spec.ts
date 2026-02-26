import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { authGuard, guestGuard } from './auth.guards';

describe('auth guards', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let loginTree: UrlTree;
  let dashboardTree: UrlTree;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['hasSession']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    loginTree = {} as UrlTree;
    dashboardTree = {} as UrlTree;
    routerSpy.createUrlTree.and.callFake((commands: readonly unknown[]) => {
      if (commands[0] === '/login') {
        return loginTree;
      }
      if (commands[0] === '/dashboard') {
        return dashboardTree;
      }
      return {} as UrlTree;
    });
  });

  it('authGuard should allow navigation when session exists', () => {
    authServiceSpy.hasSession.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBeTrue();
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('authGuard should redirect to login when session is missing', () => {
    authServiceSpy.hasSession.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(loginTree);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('guestGuard should allow navigation when session is missing', () => {
    authServiceSpy.hasSession.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));

    expect(result).toBeTrue();
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('guestGuard should redirect to dashboard when session exists', () => {
    authServiceSpy.hasSession.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));

    expect(result).toBe(dashboardTree);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});
