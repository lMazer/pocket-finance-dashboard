import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

interface NavItem {
  label: string;
  path: string;
  badge?: string;
}

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.css'
})
export class ShellLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.authService.user;
  protected readonly isLoggingOut = signal(false);
  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Transacoes', path: '/transactions' },
    { label: 'Categorias', path: '/categories' },
    { label: 'Metas', path: '/budgets', badge: 'MVP' }
  ];

  protected logout(): void {
    if (this.isLoggingOut()) {
      return;
    }

    this.isLoggingOut.set(true);
    this.authService.logout().subscribe({
      next: () => {
        this.isLoggingOut.set(false);
        void this.router.navigateByUrl('/login');
      },
      error: () => {
        this.authService.clearSession();
        this.isLoggingOut.set(false);
        void this.router.navigateByUrl('/login');
      }
    });
  }
}
