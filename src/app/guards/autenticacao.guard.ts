import { inject } from '@angular/core'
import { CanMatchFn, Router } from '@angular/router'
import { SessaoService } from '../services/sessao.service'

export const autenticacaoGuard: CanMatchFn = () => {
  const sessaoService = inject(SessaoService)
  const router = inject(Router)

  if (sessaoService.isAutenticado()) return true

  if (sessaoService.token() !== null) {
    sessaoService.encerrarSessao('expiracao')
  }
  return router.parseUrl('/login')
}

export const visitanteGuard: CanMatchFn = () => {
  const sessaoService = inject(SessaoService)
  const router = inject(Router)

  return sessaoService.isAutenticado() ? router.parseUrl('/inicio') : true
}
