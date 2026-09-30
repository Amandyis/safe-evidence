import { Routes } from '@angular/router'
import { autenticacaoGuard, visitanteGuard } from './guards/autenticacao.guard'
import { Login } from './pages/login/login'

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: Login,
    canMatch: [visitanteGuard],
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./pages/cadastro/cadastro').then((modulo) => modulo.Cadastro),
    canMatch: [visitanteGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/layout-principal/layout-principal').then(
        (modulo) => modulo.LayoutPrincipal,
      ),
    canMatch: [autenticacaoGuard],
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('./pages/inicio/inicio').then((modulo) => modulo.Inicio),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil').then((modulo) => modulo.Perfil),
      },
      {
        path: 'evidencias/:idGravacao',
        loadComponent: () =>
          import('./pages/detalhe-evidencia/detalhe-evidencia').then(
            (modulo) => modulo.DetalheEvidencia,
          ),
      },
      {
        path: 'manual',
        loadComponent: () => import('./pages/manual/manual').then((modulo) => modulo.Manual),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'inicio',
  },
]
