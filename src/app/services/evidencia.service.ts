import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Router } from '@angular/router'
import { Observable, map } from 'rxjs'
import { URL_BASE_API } from '../shared/constants/api.constants'
import { Evidencia, EvidenciaApi, EventoStatusAnaliseApi } from '../shared/models/evidencia.model'
import {
  ArquivoBaixado,
  EvidenciaDetalhada,
  EvidenciaDetalhadaApi,
  Laudo,
  LaudoApi,
  ResultadoIntegridadeApi,
  UrlTemporariaVideoApi,
} from '../shared/models/evidencia-detalhada.model'
import { extrairNomeArquivo } from '../shared/utils/download-arquivo'
import { formatarCodigoEvidencia } from '../shared/utils/formatadores'
import { SessaoService } from './sessao.service'

const EVENTO_STATUS_ANALISE = 'status_analise'
const EVENTO_SESSAO_ENCERRADA = 'sessao_encerrada'

function converterEvidencia(evidenciaApi: EvidenciaApi): Evidencia {
  const gravadaEm = new Date(evidenciaApi.gravada_em)
  return {
    idGravacao: evidenciaApi.id_gravacao,
    codigo: formatarCodigoEvidencia(evidenciaApi.id_gravacao, gravadaEm),
    gravadaEm,
    dispositivo: evidenciaApi.dispositivo,
    duracaoEmSegundos: evidenciaApi.duracao_segundos,
    statusAnalise: evidenciaApi.status_analise,
    veredicto: evidenciaApi.veredicto,
    score: evidenciaApi.score,
    isVinculadaAProcesso: evidenciaApi.vinculada_a_processo,
  }
}

function converterLaudo(laudoApi: LaudoApi): Laudo {
  return {
    idLaudo: laudoApi.id_laudo,
    emitidoEm: new Date(laudoApi.timestamp_emissao),
    dispositivoOrigem: laudoApi.dispositivo_origem,
    hashVideoOriginal: laudoApi.hash_video_original,
    classificacaoFinal: laudoApi.classificacao_final,
    veredicto: laudoApi.veredicto,
    indiceProbabilidade: laudoApi.indice_probabilidade,
    segmentosCriticos: laudoApi.segmentos_criticos.map((segmentoApi) => ({
      inicioEmSegundos: segmentoApi.inicio_s,
      fimEmSegundos: segmentoApi.fim_s,
      score: segmentoApi.score,
    })),
    versaoAlgoritmo: laudoApi.algoritmo_versao,
    duracaoVideoEmSegundos: laudoApi.duracao_video_segundos,
    tempoProcessamentoEmMs: laudoApi.tempo_processamento_ms,
    isDentroDoPrazo: laudoApi.dentro_do_prazo_rn16,
  }
}

function converterEvidenciaDetalhada(detalheApi: EvidenciaDetalhadaApi): EvidenciaDetalhada {
  return {
    evidencia: converterEvidencia(detalheApi),
    hashSha256: detalheApi.hash_sha256,
    descricaoProcessoJudicial:
      typeof detalheApi.processo_judicial === 'string' ? detalheApi.processo_judicial : null,
    tentativasAnalise: detalheApi.tentativas_analise,
    ultimoErroAnalise: detalheApi.ultimo_erro_analise,
    laudo: detalheApi.laudo ? converterLaudo(detalheApi.laudo) : null,
  }
}

@Injectable({ providedIn: 'root' })
export class EvidenciaService {
  private readonly http = inject(HttpClient)
  private readonly router = inject(Router)
  private readonly sessaoService = inject(SessaoService)
  private readonly urlEvidencias = `${URL_BASE_API}/evidencias`

  listarEvidencias(): Observable<Evidencia[]> {
    return this.http
      .get<EvidenciaApi[]>(this.urlEvidencias)
      .pipe(map((evidenciasApi) => evidenciasApi.map(converterEvidencia)))
  }

  buscarEvidenciaDetalhada(idGravacao: number): Observable<EvidenciaDetalhada> {
    return this.http
      .get<EvidenciaDetalhadaApi>(`${this.urlEvidencias}/${idGravacao}`)
      .pipe(map(converterEvidenciaDetalhada))
  }

  obterUrlTemporariaVideo(idGravacao: number): Observable<string> {
    return this.http
      .get<UrlTemporariaVideoApi>(`${this.urlEvidencias}/${idGravacao}/url`)
      .pipe(map((respostaUrl) => respostaUrl.url))
  }

  baixarLaudo(idGravacao: number): Observable<ArquivoBaixado> {
    return this.http
      .get(`${this.urlEvidencias}/${idGravacao}/laudo`, {
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(
        map((resposta) => ({
          conteudo: resposta.body ?? new Blob(),
          nomeArquivo:
            extrairNomeArquivo(resposta.headers.get('Content-Disposition')) ??
            `laudo-evidencia-${idGravacao}.json`,
          hashSha256: resposta.headers.get('X-Laudo-SHA256'),
        })),
      )
  }

  verificarIntegridade(idGravacao: number): Observable<boolean> {
    return this.http
      .get<ResultadoIntegridadeApi>(`${this.urlEvidencias}/${idGravacao}/integridade`)
      .pipe(map((resultado) => resultado.integro))
  }

  solicitarNovaAnalise(idGravacao: number): Observable<void> {
    return this.http
      .post<void>(`${this.urlEvidencias}/${idGravacao}/analise`, null)
      .pipe(map(() => undefined))
  }

  excluirEvidencia(idGravacao: number): Observable<void> {
    return this.http
      .delete<void>(`${this.urlEvidencias}/${idGravacao}`, { body: { confirmacao: true } })
      .pipe(map(() => undefined))
  }

  escutarAtualizacoesDeStatus(
    aoReceberAtualizacao: (atualizacao: EventoStatusAnaliseApi) => void,
  ): () => void {
    const tokenAcesso = this.sessaoService.token()
    if (!tokenAcesso) return () => undefined

    const fonteEventos = new EventSource(
      `${this.urlEvidencias}/eventos?token=${encodeURIComponent(tokenAcesso)}`,
    )

    fonteEventos.addEventListener(EVENTO_STATUS_ANALISE, (evento) => {
      const atualizacao = JSON.parse((evento as MessageEvent<string>).data)
      aoReceberAtualizacao(atualizacao as EventoStatusAnaliseApi)
    })

    fonteEventos.addEventListener(EVENTO_SESSAO_ENCERRADA, () => {
      fonteEventos.close()
      this.sessaoService.encerrarSessao('expiracao')
      this.router.navigateByUrl('/login')
    })

    return () => fonteEventos.close()
  }
}
