import { Routes } from '@angular/router'
import { autenticacaoGuard, visitanteGuard } from './guards/autenticacao.guard'
import { LayoutPrincipal } from './layouts/layout-principal/layout-principal'
import { Login } from './pages/login/login'
import { Cadastro } from './pages/cadastro/cadastro'
import { Inicio } from './pages/inicio/inicio'
import { Perfil } from './pages/perfil/perfil'
import { DetalheEvidencia } from './pages/detalhe-evidencia/detalhe-evidencia'
import { Manual } from './pages/manual/manual'

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: Login,
    canActivate: [visitanteGuard],
  },
  {
    path: 'cadastro',
    component: Cadastro,
    canActivate: [visitanteGuard],
  },
  {
    path: '',
    component: LayoutPrincipal,
    canActivate: [autenticacaoGuard],
    children: [
      {
        path: 'inicio',
        component: Inicio,
      },
      {
        path: 'perfil',
        component: Perfil,
      },
      {
        path: 'evidencias/:idGravacao',
        component: DetalheEvidencia,
      },
      {
        path: 'manual',
        component: Manual,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'inicio',
  },
]
