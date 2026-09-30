import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, map, tap } from 'rxjs'
import { URL_BASE_API } from '../shared/constants/api.constants'
import {
  AtualizacaoPerfilApi,
  FinalidadeCodigoVerificacao,
  PerfilUsuario,
  PerfilUsuarioApi,
} from '../shared/models/perfil-usuario.model'
import { SessaoService } from './sessao.service'

function converterPerfil(perfilApi: PerfilUsuarioApi): PerfilUsuario {
  return {
    idVitima: perfilApi.id_vitima,
    nome: perfilApi.nome,
    cpfMascarado: perfilApi.cpf_mascarado,
    email: perfilApi.email,
    telefone: perfilApi.telefone,
    endereco: { ...perfilApi.endereco, complemento: perfilApi.endereco.complemento ?? '' },
    consentimentoRegistradoEm: new Date(perfilApi.consentimento_em),
    contaCriadaEm: new Date(perfilApi.criada_em),
    dispositivo: perfilApi.dispositivo
      ? {
          idDispositivo: perfilApi.dispositivo.id_dispositivo,
          percentualBateria: perfilApi.dispositivo.status_bateria,
        }
      : null,
  }
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient)
  private readonly sessaoService = inject(SessaoService)
  private readonly urlPerfil = `${URL_BASE_API}/perfil`

  buscarPerfil(): Observable<PerfilUsuario> {
    return this.http.get<PerfilUsuarioApi>(this.urlPerfil).pipe(map(converterPerfil))
  }

  atualizarPerfil(atualizacao: AtualizacaoPerfilApi): Observable<PerfilUsuario> {
    return this.http.put<PerfilUsuarioApi>(this.urlPerfil, atualizacao).pipe(
      map(converterPerfil),
      tap((perfilAtualizado) =>
        this.sessaoService.atualizarDadosUsuario({
          nome: perfilAtualizado.nome,
          email: perfilAtualizado.email,
        }),
      ),
    )
  }

  solicitarCodigoVerificacao(finalidade: FinalidadeCodigoVerificacao): Observable<void> {
    return this.http
      .post<unknown>(`${this.urlPerfil}/codigo`, { finalidade })
      .pipe(map(() => undefined))
  }

  vincularDispositivo(idDispositivo: string): Observable<void> {
    return this.http
      .post<unknown>(`${this.urlPerfil}/dispositivo`, { id_dispositivo: idDispositivo })
      .pipe(map(() => undefined))
  }

  excluirConta(codigoVerificacao: string): Observable<void> {
    return this.http
      .delete<void>(this.urlPerfil, { body: { codigo: codigoVerificacao } })
      .pipe(map(() => undefined))
  }
}
