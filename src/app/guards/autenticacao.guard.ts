import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { SessaoService } from '../services/sessao.service'

export const autenticacaoGuard: CanActivateFn = () => {
  const sessaoService = inject(SessaoService)
  const router = inject(Router)

  if (sessaoService.isAutenticado()) return true

  if (sessaoService.token() !== null) {
    sessaoService.encerrarSessao('expiracao')
  }
  return router.parseUrl('/login')
}

export const visitanteGuard: CanActivateFn = () => {
  const sessaoService = inject(SessaoService)
  const router = inject(Router)

  return sessaoService.isAutenticado() ? router.parseUrl('/inicio') : true
}
