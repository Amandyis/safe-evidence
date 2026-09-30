import { Evidencia, EvidenciaApi, Veredicto } from './evidencia.model'

export type ClassificacaoIntensidade = 'normal' | 'alerta' | 'critico'

export interface SegmentoCriticoApi {
  inicio_s: number
  fim_s: number
  score: number
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
  segmentos_criticos: SegmentoCriticoApi[]
  algoritmo_versao: string
  duracao_video_segundos: number
  tempo_processamento_ms: number
  dentro_do_prazo_rn16: boolean
}

export interface EvidenciaDetalhadaApi extends EvidenciaApi {
  hash_sha256: string
  processo_judicial: unknown
  tentativas_analise: number
  ultimo_erro_analise: string | null
  laudo: LaudoApi | null
}

export interface UrlTemporariaVideoApi {
  url: string
}

export interface ResultadoIntegridadeApi {
  integro: boolean
}

export interface SegmentoCritico {
  inicioEmSegundos: number
  fimEmSegundos: number
  score: number
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
  versaoAlgoritmo: string
  duracaoVideoEmSegundos: number
  tempoProcessamentoEmMs: number
  isDentroDoPrazo: boolean
}

export interface EvidenciaDetalhada {
  evidencia: Evidencia
  hashSha256: string
  descricaoProcessoJudicial: string | null
  tentativasAnalise: number
  ultimoErroAnalise: string | null
  laudo: Laudo | null
}

export interface ArquivoBaixado {
  conteudo: Blob
  nomeArquivo: string
  hashSha256: string | null
}

export const CLASSE_COR_POR_INTENSIDADE: Record<ClassificacaoIntensidade, string> = {
  normal: 'bg-slate-200',
  alerta: 'bg-amber-400',
  critico: 'bg-red-700',
}

const INTENSIDADE_MINIMA_CRITICA = 80
const INTENSIDADE_MINIMA_ALERTA = 50

export function classificarIntensidade(intensidade: number): ClassificacaoIntensidade {
  if (intensidade >= INTENSIDADE_MINIMA_CRITICA) return 'critico'
  if (intensidade >= INTENSIDADE_MINIMA_ALERTA) return 'alerta'
  return 'normal'
}
