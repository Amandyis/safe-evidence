import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'
import { MotivoEncerramentoSessao, SessaoService } from '../services/sessao.service'
import { URL_BASE_API } from '../shared/constants/api.constants'
import { RespostaErroApi } from '../shared/models/erro-api.model'

const STATUS_NAO_AUTORIZADO = 401

const ROTAS_PUBLICAS_API = ['/auth/login', '/auth/mfa', '/auth/cadastro', '/auth/senha']

const CODIGOS_401_QUE_NAO_ENCERRAM_SESSAO = ['MFA_OBRIGATORIO', 'MFA_INVALIDO']

const MOTIVO_ENCERRAMENTO_POR_CODIGO: Record<string, MotivoEncerramentoSessao> = {
  SESSAO_INATIVA: 'inatividade',
}

function extrairCodigoErro(erro: HttpErrorResponse): string | null {
  const corpoResposta = erro.error as Partial<RespostaErroApi> | null
  return corpoResposta?.codigo ?? null
}

function isErroDeSessao(erro: unknown): erro is HttpErrorResponse {
  if (!(erro instanceof HttpErrorResponse) || erro.status !== STATUS_NAO_AUTORIZADO) return false
  const codigoErro = extrairCodigoErro(erro)
  return codigoErro === null || !CODIGOS_401_QUE_NAO_ENCERRAM_SESSAO.includes(codigoErro)
}

export const autenticacaoInterceptor: HttpInterceptorFn = (requisicao, proximoManipulador) => {
  if (!requisicao.url.startsWith(URL_BASE_API)) {
    return proximoManipulador(requisicao)
  }

  const sessaoService = inject(SessaoService)
  const router = inject(Router)

  const caminhoApi = requisicao.url.slice(URL_BASE_API.length)
  const isRotaPublica = ROTAS_PUBLICAS_API.some((rotaPublica) => caminhoApi.startsWith(rotaPublica))
  const tokenAcesso = sessaoService.token()

  const requisicaoComToken =
    tokenAcesso && !isRotaPublica
      ? requisicao.clone({ setHeaders: { Authorization: `Bearer ${tokenAcesso}` } })
      : requisicao

  return proximoManipulador(requisicaoComToken).pipe(
    catchError((erro: unknown) => {
      if (!isRotaPublica && isErroDeSessao(erro)) {
        const codigoErro = extrairCodigoErro(erro) ?? ''
        sessaoService.encerrarSessao(MOTIVO_ENCERRAMENTO_POR_CODIGO[codigoErro] ?? 'expiracao')
        router.navigateByUrl('/login')
      }
      return throwError(() => erro)
    }),
  )
}
