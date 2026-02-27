import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { HttpActivityService } from '../core/http/http-activity.service';
import { ToastService } from '../core/ui/toast.service';
import { ShellLayoutComponent } from './shell-layout.component';

describe('ShellLayoutComponent', () => {
  const authServiceMock = {
    user: signal({ id: 'u1', email: 'demo@pocket.local', fullName: 'Demo User' }),
    logout: jasmine.createSpy('logout').and.returnValue(of(void 0)),
    clearSession: jasmine.createSpy('clearSession')
  };

  const toastServiceMock = {
    messages: signal([] as Array<{ id: number; kind: 'error' | 'success' | 'info'; message: string }>),
    info: jasmine.createSpy('info'),
    dismiss: jasmine.createSpy('dismiss')
  };

  const httpActivityMock = {
    isBusy: signal(false)
  };

  beforeEach(async () => {
    authServiceMock.logout.calls.reset();
    authServiceMock.clearSession.calls.reset();
    toastServiceMock.info.calls.reset();
    toastServiceMock.dismiss.calls.reset();

    await TestBed.configureTestingModule({
      imports: [ShellLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: HttpActivityService, useValue: httpActivityMock }
      ]
    }).compileComponents();
  });

  it('should render nav items with icons', () => {
    const fixture = TestBed.createComponent(ShellLayoutComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const navIcons = host.querySelectorAll('.nav__icon');
    const navLinks = host.querySelectorAll('.nav__link');

    expect(navLinks.length).toBe(5);
    expect(navIcons.length).toBe(5);
  });

  it('should logout and navigate to login', () => {
    const fixture = TestBed.createComponent(ShellLayoutComponent);
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.topbar-link--button') as HTMLButtonElement;
    button.click();

    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(toastServiceMock.info).toHaveBeenCalledWith('Sessao encerrada.');
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });

  it('should open and close mobile nav from toggle and backdrop', () => {
    const fixture = TestBed.createComponent(ShellLayoutComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const menuToggle = host.querySelector('button[aria-controls="pf-mobile-nav"]') as HTMLButtonElement;
    expect(menuToggle.getAttribute('aria-expanded')).toBe('false');

    menuToggle.click();
    fixture.detectChanges();

    expect(menuToggle.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('.shell__sidebar')?.classList.contains('shell__sidebar--open')).toBeTrue();
    expect(host.querySelector('.shell__backdrop')).not.toBeNull();

    (host.querySelector('.shell__backdrop') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(menuToggle.getAttribute('aria-expanded')).toBe('false');
    expect(host.querySelector('.shell__sidebar')?.classList.contains('shell__sidebar--open')).toBeFalse();
    expect(host.querySelector('.shell__backdrop')).toBeNull();
  });

  it('should close mobile nav when a nav link is clicked', () => {
    const fixture = TestBed.createComponent(ShellLayoutComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const menuToggle = host.querySelector('button[aria-controls="pf-mobile-nav"]') as HTMLButtonElement;
    menuToggle.click();
    fixture.detectChanges();

    const firstNavLink = host.querySelector('.nav__link') as HTMLAnchorElement;
    firstNavLink.click();
    fixture.detectChanges();

    expect(menuToggle.getAttribute('aria-expanded')).toBe('false');
    expect(host.querySelector('.shell__sidebar')?.classList.contains('shell__sidebar--open')).toBeFalse();
  });
});
