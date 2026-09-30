import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, catchError, map, of, tap } from 'rxjs'
import { URL_BASE_API } from '../shared/constants/api.constants'
import {
  CredenciaisLogin,
  RespostaCadastro,
  RespostaComMensagem,
  RespostaLogin,
  RespostaReenvioMfa,
  RespostaValidacaoMfa,
  SolicitacaoCadastro,
  SolicitacaoRedefinicaoSenha,
} from '../shared/models/autenticacao.model'
import { SessaoService } from './sessao.service'

@Injectable({ providedIn: 'root' })
export class AutenticacaoService {
  private readonly http = inject(HttpClient)
  private readonly sessaoService = inject(SessaoService)
  private readonly urlAutenticacao = `${URL_BASE_API}/auth`

  entrar(credenciais: CredenciaisLogin): Observable<RespostaLogin> {
    return this.http.post<RespostaLogin>(`${this.urlAutenticacao}/login`, credenciais)
  }

  validarCodigoMfa(mfaToken: string, codigo: string): Observable<RespostaValidacaoMfa> {
    return this.http
      .post<RespostaValidacaoMfa>(`${this.urlAutenticacao}/mfa`, { mfa_token: mfaToken, codigo })
      .pipe(tap((respostaValidacao) => this.sessaoService.iniciarSessao(respostaValidacao)))
  }

  reenviarCodigoMfa(mfaToken: string): Observable<RespostaReenvioMfa> {
    return this.http.post<RespostaReenvioMfa>(`${this.urlAutenticacao}/mfa/reenviar`, {
      mfa_token: mfaToken,
    })
  }

  cadastrar(solicitacaoCadastro: SolicitacaoCadastro): Observable<RespostaCadastro> {
    return this.http.post<RespostaCadastro>(`${this.urlAutenticacao}/cadastro`, solicitacaoCadastro)
  }

  solicitarRecuperacaoSenha(email: string): Observable<RespostaComMensagem> {
    return this.http.post<RespostaComMensagem>(`${this.urlAutenticacao}/senha/esqueci`, { email })
  }

  redefinirSenha(solicitacao: SolicitacaoRedefinicaoSenha): Observable<RespostaComMensagem> {
    return this.http.post<RespostaComMensagem>(
      `${this.urlAutenticacao}/senha/redefinir`,
      solicitacao,
    )
  }

  sair(): Observable<void> {
    return this.http.post<void>(`${this.urlAutenticacao}/logout`, null).pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      tap(() => this.sessaoService.encerrarSessao('logout')),
    )
  }
}
