import { Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'cases', loadComponent: () => import('./pages/cases/cases.component').then(m => m.CasesComponent) },
      { path: 'cases/:caseId', loadComponent: () => import('./pages/case-detail/case-detail.component').then(m => m.CaseDetailComponent) },
      { path: 'scans/:scanId', loadComponent: () => import('./pages/scan-detail/scan-detail.component').then(m => m.ScanDetailComponent) },
      { path: 'instructions', loadComponent: () => import('./pages/instructions/instructions.component').then(m => m.InstructionsComponent) },
    ]
  },
  { path: '**', redirectTo: '' },
];
