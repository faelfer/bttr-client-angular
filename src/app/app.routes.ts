import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth';
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [guestGuard],
    title: 'Entrar · Bttr',
    loadComponent: () => import('./features/auth/auth.component').then((m) => m.AuthComponent),
    data: { mode: 'signin' },
  },
  {
    path: 'sign-up',
    canActivate: [guestGuard],
    title: 'Criar conta · Bttr',
    loadComponent: () => import('./features/auth/auth.component').then((m) => m.AuthComponent),
    data: { mode: 'signup' },
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    title: 'Recuperar senha · Bttr',
    loadComponent: () => import('./features/auth/auth.component').then((m) => m.AuthComponent),
    data: { mode: 'forgot' },
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'home',
        title: 'Minhas habilidades · Bttr',
        loadComponent: () =>
          import('./features/skills/skills.component').then((m) => m.SkillsComponent),
      },
      {
        path: 'profile',
        title: 'Meu perfil · Bttr',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'redefine-password',
        title: 'Alterar senha · Bttr',
        loadComponent: () =>
          import('./features/profile/password.component').then((m) => m.PasswordComponent),
      },
      {
        path: 'skills/create',
        title: 'Nova habilidade · Bttr',
        loadComponent: () =>
          import('./features/skills/skill-form.component').then((m) => m.SkillFormComponent),
      },
      {
        path: 'skills/:skillId/update',
        title: 'Editar habilidade · Bttr',
        loadComponent: () =>
          import('./features/skills/skill-form.component').then((m) => m.SkillFormComponent),
      },
      {
        path: 'skills/:skillId/statistic',
        title: 'Estatísticas · Bttr',
        loadComponent: () =>
          import('./features/skills/statistics.component').then((m) => m.StatisticsComponent),
      },
      {
        path: 'times',
        title: 'Histórico de tempo · Bttr',
        loadComponent: () =>
          import('./features/times/times.component').then((m) => m.TimesComponent),
      },
      {
        path: 'times/create',
        title: 'Registrar tempo · Bttr',
        loadComponent: () =>
          import('./features/times/time-form.component').then((m) => m.TimeFormComponent),
      },
      {
        path: 'times/:timeId/update',
        title: 'Editar tempo · Bttr',
        loadComponent: () =>
          import('./features/times/time-form.component').then((m) => m.TimeFormComponent),
      },
    ],
  },
  {
    path: '**',
    title: 'Página não encontrada · Bttr',
    loadComponent: () => import('./shared/not-found.component').then((m) => m.NotFoundComponent),
  },
];
