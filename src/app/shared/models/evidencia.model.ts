export type StatusAnalise = 'Pendente' | 'Processando' | 'Concluido' | 'Erro'

export type Veredicto = 'Alerta Alto' | 'Anomalia' | 'Normal'

export interface EvidenciaApi {
  id_gravacao: number
  gravada_em: string
  dispositivo: string
  duracao_segundos: number | null
  status_analise: StatusAnalise
  veredicto: Veredicto | null
  score: number | null
  vinculada_a_processo: boolean
}

export interface EventoStatusAnaliseApi {
  id_gravacao: number
  status_analise: StatusAnalise
  veredicto: Veredicto | null
  score: number | null
}

export interface PaginaEvidencias {
  evidencias: Evidencia[]
  total: number
}

export interface Evidencia {
  idGravacao: number
  codigo: string
  gravadaEm: Date
  dispositivo: string
  duracaoEmSegundos: number | null
  statusAnalise: StatusAnalise
  veredicto: Veredicto | null
  score: number | null
  isVinculadaAProcesso: boolean
}

export interface AparenciaSelo {
  rotulo: string
  classeIcone: string
  classesCor: string
}

export interface AparenciaVeredicto extends AparenciaSelo {
  classesSeloDestaque: string
  classeCorBarra: string
}

export interface OpcaoStatusAnalise {
  rotulo: string
  valor: StatusAnalise
}

export const APARENCIA_POR_STATUS_ANALISE: Record<StatusAnalise, AparenciaSelo> = {
  Pendente: {
    rotulo: 'Pendente',
    classeIcone: 'pi pi-clock',
    classesCor: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  Processando: {
    rotulo: 'Em análise',
    classeIcone: 'pi pi-sync',
    classesCor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  Concluido: {
    rotulo: 'Analisado',
    classeIcone: 'pi pi-check-circle',
    classesCor: 'bg-green-50 text-green-700 border-green-200',
  },
  Erro: {
    rotulo: 'Erro',
    classeIcone: 'pi pi-times-circle',
    classesCor: 'bg-red-50 text-red-700 border-red-200',
  },
}

export const APARENCIA_POR_VEREDICTO: Record<Veredicto, AparenciaVeredicto> = {
  'Alerta Alto': {
    rotulo: 'Alerta alto',
    classeIcone: 'pi pi-exclamation-triangle',
    classesCor: 'bg-red-50 text-red-700 border-red-200',
    classesSeloDestaque: 'bg-red-700 text-white',
    classeCorBarra: 'bg-red-600',
  },
  Anomalia: {
    rotulo: 'Anomalia',
    classeIcone: 'pi pi-exclamation-circle',
    classesCor: 'bg-amber-50 text-amber-800 border-amber-200',
    classesSeloDestaque: 'bg-amber-500 text-gray-900',
    classeCorBarra: 'bg-amber-400',
  },
  Normal: {
    rotulo: 'Normal',
    classeIcone: 'pi pi-check',
    classesCor: 'bg-gray-50 text-gray-700 border-gray-200',
    classesSeloDestaque: 'bg-green-600 text-white',
    classeCorBarra: 'bg-green-500',
  },
}

export const OPCOES_STATUS_ANALISE: OpcaoStatusAnalise[] = (
  Object.keys(APARENCIA_POR_STATUS_ANALISE) as StatusAnalise[]
).map((status) => ({ rotulo: APARENCIA_POR_STATUS_ANALISE[status].rotulo, valor: status }))
