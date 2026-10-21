import { Evidencia, EvidenciaApi, Veredicto } from './evidencia.model'

export type ClassificacaoIntensidade = 'normal' | 'alerta' | 'critico'

export type StatusCarimboTempo = 'emitido' | 'pendente' | 'falhou'

export interface SegmentoCriticoApi {
  inicio_s: number
  fim_s: number
  score: number
}

export interface TrechoLinhaTempoApi {
  inicio_s: number
  fim_s: number
  score: number
  nivel: ClassificacaoIntensidade
  score_frame?: number
  pico_s?: number
}

export interface CarimboTempoApi {
  status: StatusCarimboTempo
  emitido_em?: string
  autoridade?: string | null
  numero_serie?: string | null
  ultimo_erro?: string | null
  confere_com_hash?: boolean | null
}

export interface LaudoApi {
  id_laudo: string
  timestamp_emissao: string
  dispositivo_origem: string
  hash_video_original: string
  status_analise: string
  classificacao_final: string
  veredicto: Veredicto
  indice_probabilidade: number
  segmentos_criticos: SegmentoCriticoApi[] | null
  linha_do_tempo?: TrechoLinhaTempoApi[] | null
  algoritmo_versao: string
  duracao_video_segundos: number | null
  tempo_processamento_ms: number | null
  dentro_do_prazo_rn16: boolean | null
  carimbo_tempo?: CarimboTempoApi
}

export interface EvidenciaDetalhadaApi extends EvidenciaApi {
  hash_sha256: string
  carimbo_tempo?: CarimboTempoApi
  processo_judicial: unknown
  tentativas_analise: number
  ultimo_erro_analise: string | null
  laudo: LaudoApi | null
}

export interface UrlTemporariaVideoApi {
  id_gravacao: number
  url: string
  expira_em: string
  validade_minutos: number
}

export interface ResultadoIntegridadeApi {
  id_gravacao?: number
  integro: boolean
  hash_esperado?: string
  hash_calculado?: string
  verificado_em?: string
  tempo_verificacao_ms?: number
  carimbo_tempo?: CarimboTempoApi
  erro?: string
}

export interface SegmentoCritico {
  inicioEmSegundos: number
  fimEmSegundos: number
  score: number
}

export interface TrechoLinhaTempo {
  inicioEmSegundos: number
  fimEmSegundos: number
  score: number
  nivel: ClassificacaoIntensidade
}

export interface CarimboTempo {
  status: StatusCarimboTempo
  emitidoEm: Date | null
  autoridade: string | null
  numeroSerie: string | null
  ultimoErro: string | null
}

export interface Laudo {
  idLaudo: string
  emitidoEm: Date
  dispositivoOrigem: string
  hashVideoOriginal: string
  classificacaoFinal: string
  veredicto: Veredicto
  indiceProbabilidade: number
  segmentosCriticos: SegmentoCritico[]
  linhaDoTempo: TrechoLinhaTempo[]
  versaoAlgoritmo: string
  duracaoVideoEmSegundos: number | null
  tempoProcessamentoEmMs: number | null
  isDentroDoPrazo: boolean | null
}

export interface EvidenciaDetalhada {
  evidencia: Evidencia
  hashSha256: string
  carimboTempo: CarimboTempo | null
  descricaoProcessoJudicial: string | null
  tentativasAnalise: number
  ultimoErroAnalise: string | null
  laudo: Laudo | null
}

export interface ResultadoIntegridade {
  isIntegro: boolean
  hashEsperado: string | null
  hashCalculado: string | null
  verificadoEm: Date
  tempoVerificacaoEmMs: number | null
  isCarimboConferido: boolean | null
  mensagem: string | null
}

export interface ArquivoBaixado {
  conteudo: Blob
  nomeArquivo: string
  hashSha256: string | null
}

export interface LaudoPdfBaixado extends ArquivoBaixado {
  codigoVerificacao: string | null
}

export const CLASSE_COR_POR_INTENSIDADE: Record<ClassificacaoIntensidade, string> = {
  normal: 'bg-slate-200',
  alerta: 'bg-amber-400',
  critico: 'bg-red-700',
}

export const ROTULO_STATUS_CARIMBO: Record<StatusCarimboTempo, string> = {
  emitido: 'Emitido',
  pendente: 'Pendente',
  falhou: 'Falhou',
}

const INTENSIDADE_MINIMA_CRITICA = 80
const INTENSIDADE_MINIMA_ALERTA = 50

export function classificarIntensidade(intensidade: number): ClassificacaoIntensidade {
  if (intensidade >= INTENSIDADE_MINIMA_CRITICA) return 'critico'
  if (intensidade >= INTENSIDADE_MINIMA_ALERTA) return 'alerta'
  return 'normal'
}
