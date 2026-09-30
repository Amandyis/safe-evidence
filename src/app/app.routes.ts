import { Routes } from '@angular/router'
import { LayoutPrincipal } from './layouts/layout-principal/layout-principal'
import { Login } from './pages/login/login'
import { Cadastro } from './pages/cadastro/cadastro'
import { Inicio } from './pages/inicio/inicio'
import { Perfil } from './pages/perfil/perfil'

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'cadastro',
    component: Cadastro,
  },
  {
    path: '',
    component: LayoutPrincipal,
    children: [
      {
        path: 'inicio',
        component: Inicio,
      },
      {
        path: 'perfil',
        component: Perfil,
      },
    ],
  },
]
