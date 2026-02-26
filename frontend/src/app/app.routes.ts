import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';
import { ShellLayoutComponent } from './layout/shell-layout.component';
import { BudgetsPageComponent } from './pages/budgets-page.component';
import { CategoriesPageComponent } from './pages/categories-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { ReportsPageComponent } from './pages/reports-page.component';
import { TransactionsPageComponent } from './pages/transactions-page.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPageComponent,
    canActivate: [guestGuard],
    title: 'Entrar | Pocket Finance'
  },
  {
    path: '',
    component: ShellLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardPageComponent, title: 'Dashboard | Pocket Finance' },
      { path: 'transactions', component: TransactionsPageComponent, title: 'Transacoes | Pocket Finance' },
      { path: 'reports', component: ReportsPageComponent, title: 'Relatorios | Pocket Finance' },
      { path: 'categories', component: CategoriesPageComponent, title: 'Categorias | Pocket Finance' },
      { path: 'budgets', component: BudgetsPageComponent, title: 'Metas | Pocket Finance' }
    ]
  },
  { path: '**', redirectTo: '' }
];
