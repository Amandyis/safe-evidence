import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Router } from '@angular/router'
import { Observable, catchError, from, map, of, switchMap, throwError } from 'rxjs'
import { URL_BASE_API } from '../shared/constants/api.constants'
import {
  Evidencia,
  EvidenciaApi,
  EventoStatusAnaliseApi,
  PaginaEvidencias,
} from '../shared/models/evidencia.model'
import {
  ArquivoBaixado,
  CarimboTempo,
  CarimboTempoApi,
  EvidenciaDetalhada,
  EvidenciaDetalhadaApi,
  Laudo,
  LaudoApi,
  LaudoPdfBaixado,
  ResultadoIntegridade,
  ResultadoIntegridadeApi,
  UrlTemporariaVideoApi,
} from '../shared/models/evidencia-detalhada.model'
import { extrairNomeArquivo } from '../shared/utils/download-arquivo'
import { converterErroBlobEmJson } from '../shared/utils/erro-api'
import { formatarCodigoEvidencia } from '../shared/utils/formatadores'
import { SessaoService } from './sessao.service'

const EVENTO_STATUS_ANALISE = 'status_analise'
const EVENTO_SESSAO_ENCERRADA = 'sessao_encerrada'
const CABECALHO_TOTAL_REGISTROS = 'X-Total-Count'
const CABECALHO_HASH_LAUDO = 'X-Laudo-SHA256'
const CABECALHO_CODIGO_VERIFICACAO = 'X-Codigo-Verificacao'
const CABECALHO_NOME_ARQUIVO = 'Content-Disposition'
const STATUS_INTEGRIDADE_SEM_CONFIRMACAO = [404, 409]

export const QUANTIDADE_EVIDENCIAS_POR_PAGINA = 50

function converterEvidencia(evidenciaApi: EvidenciaApi): Evidencia {
  const gravadaEm = new Date(evidenciaApi.gravada_em)
  return {
    idGravacao: evidenciaApi.id_gravacao,
    codigo: formatarCodigoEvidencia(evidenciaApi.id_gravacao, gravadaEm),
    gravadaEm,
    dispositivo: evidenciaApi.dispositivo,
    duracaoEmSegundos: evidenciaApi.duracao_segundos ?? null,
    statusAnalise: evidenciaApi.status_analise,
    veredicto: evidenciaApi.veredicto,
    score: evidenciaApi.score,
    isVinculadaAProcesso: evidenciaApi.vinculada_a_processo,
  }
}

function converterCarimboTempo(carimboApi: CarimboTempoApi | undefined): CarimboTempo | null {
  if (!carimboApi) return null
  return {
    status: carimboApi.status,
    emitidoEm: carimboApi.emitido_em ? new Date(carimboApi.emitido_em) : null,
    autoridade: carimboApi.autoridade ?? null,
    numeroSerie: carimboApi.numero_serie ?? null,
    ultimoErro: carimboApi.ultimo_erro ?? null,
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
    segmentosCriticos: (laudoApi.segmentos_criticos ?? []).map((segmentoApi) => ({
      inicioEmSegundos: segmentoApi.inicio_s,
      fimEmSegundos: segmentoApi.fim_s,
      score: segmentoApi.score,
    })),
    linhaDoTempo: (laudoApi.linha_do_tempo ?? []).map((trechoApi) => ({
      inicioEmSegundos: trechoApi.inicio_s,
      fimEmSegundos: trechoApi.fim_s,
      score: trechoApi.score,
      nivel: trechoApi.nivel,
      scorePico: trechoApi.score_frame ?? null,
      picoEmSegundos: trechoApi.pico_s ?? null,
    })),
    versaoAlgoritmo: laudoApi.algoritmo_versao,
    duracaoVideoEmSegundos: laudoApi.duracao_video_segundos ?? null,
    tempoProcessamentoEmMs: laudoApi.tempo_processamento_ms ?? null,
    isDentroDoPrazo: laudoApi.dentro_do_prazo_rn16 ?? null,
  }
}

function converterEvidenciaDetalhada(detalheApi: EvidenciaDetalhadaApi): EvidenciaDetalhada {
  const laudoApi = detalheApi.laudo
  return {
    evidencia: converterEvidencia({
      ...detalheApi,
      veredicto: detalheApi.veredicto ?? laudoApi?.veredicto ?? null,
      score: detalheApi.score ?? laudoApi?.indice_probabilidade ?? null,
      vinculada_a_processo: detalheApi.vinculada_a_processo ?? detalheApi.processo_judicial != null,
    }),
    hashSha256: detalheApi.hash_sha256,
    carimboTempo: converterCarimboTempo(detalheApi.carimbo_tempo ?? laudoApi?.carimbo_tempo),
    descricaoProcessoJudicial:
      typeof detalheApi.processo_judicial === 'string' ? detalheApi.processo_judicial : null,
    tentativasAnalise: detalheApi.tentativas_analise,
    ultimoErroAnalise: detalheApi.ultimo_erro_analise,
    laudo: detalheApi.laudo ? converterLaudo(detalheApi.laudo) : null,
  }
}

function converterResultadoIntegridade(
  resultadoApi: ResultadoIntegridadeApi,
): ResultadoIntegridade {
  return {
    isIntegro: resultadoApi.integro,
    hashEsperado: resultadoApi.hash_esperado ?? null,
    hashCalculado: resultadoApi.hash_calculado ?? null,
    verificadoEm: resultadoApi.verificado_em ? new Date(resultadoApi.verificado_em) : new Date(),
    tempoVerificacaoEmMs: resultadoApi.tempo_verificacao_ms ?? null,
    isCarimboConferido: resultadoApi.carimbo_tempo?.confere_com_hash ?? null,
    mensagem: resultadoApi.erro ?? null,
  }
}

function isResultadoIntegridadeApi(
  corpoResposta: unknown,
): corpoResposta is ResultadoIntegridadeApi {
  return (
    typeof corpoResposta === 'object' &&
    corpoResposta !== null &&
    typeof (corpoResposta as ResultadoIntegridadeApi).integro === 'boolean'
  )
}

function montarArquivoBaixado(resposta: HttpResponse<Blob>, nomePadrao: string): ArquivoBaixado {
  return {
    conteudo: resposta.body ?? new Blob(),
    nomeArquivo: extrairNomeArquivo(resposta.headers.get(CABECALHO_NOME_ARQUIVO)) ?? nomePadrao,
    hashSha256: resposta.headers.get(CABECALHO_HASH_LAUDO),
  }
}

@Injectable({ providedIn: 'root' })
export class EvidenciaService {
  private readonly http = inject(HttpClient)
  private readonly router = inject(Router)
  private readonly sessaoService = inject(SessaoService)
  private readonly urlEvidencias = `${URL_BASE_API}/evidencias`

  listarEvidencias(
    deslocamento = 0,
    limite = QUANTIDADE_EVIDENCIAS_POR_PAGINA,
  ): Observable<PaginaEvidencias> {
    const parametros = new HttpParams().set('limite', limite).set('deslocamento', deslocamento)
    return this.http
      .get<EvidenciaApi[]>(this.urlEvidencias, { params: parametros, observe: 'response' })
      .pipe(
        map((resposta) => {
          const evidencias = (resposta.body ?? []).map(converterEvidencia)
          const totalInformado = Number(resposta.headers.get(CABECALHO_TOTAL_REGISTROS))
          const total =
            Number.isFinite(totalInformado) && totalInformado > 0
              ? totalInformado
              : deslocamento + evidencias.length
          return { evidencias, total }
        }),
      )
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
    return this.baixarArquivo(`${idGravacao}/laudo`).pipe(
      map((resposta) => montarArquivoBaixado(resposta, `laudo-evidencia-${idGravacao}.json`)),
    )
  }

  baixarLaudoPdf(idGravacao: number): Observable<LaudoPdfBaixado> {
    return this.baixarArquivo(`${idGravacao}/laudo.pdf`).pipe(
      map((resposta) => ({
        ...montarArquivoBaixado(resposta, `laudo_gravacao_${idGravacao}.pdf`),
        codigoVerificacao: resposta.headers.get(CABECALHO_CODIGO_VERIFICACAO),
      })),
    )
  }

  baixarCarimboTempo(idGravacao: number): Observable<ArquivoBaixado> {
    return this.baixarArquivo(`${idGravacao}/carimbo.tsr`).pipe(
      map((resposta) => montarArquivoBaixado(resposta, `carimbo_gravacao_${idGravacao}.tsr`)),
    )
  }

  verificarIntegridade(idGravacao: number): Observable<ResultadoIntegridade> {
    return this.http
      .get<ResultadoIntegridadeApi>(`${this.urlEvidencias}/${idGravacao}/integridade`)
      .pipe(
        map(converterResultadoIntegridade),
        catchError((erro: unknown) => {
          if (
            erro instanceof HttpErrorResponse &&
            STATUS_INTEGRIDADE_SEM_CONFIRMACAO.includes(erro.status) &&
            isResultadoIntegridadeApi(erro.error)
          ) {
            return of(converterResultadoIntegridade(erro.error))
          }
          return throwError(() => erro)
        }),
      )
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

  private baixarArquivo(caminho: string): Observable<HttpResponse<Blob>> {
    return this.http
      .get(`${this.urlEvidencias}/${caminho}`, { observe: 'response', responseType: 'blob' })
      .pipe(
        catchError((erro: unknown) =>
          from(converterErroBlobEmJson(erro)).pipe(
            switchMap((erroConvertido) => throwError(() => erroConvertido)),
          ),
        ),
      )
  }
}
