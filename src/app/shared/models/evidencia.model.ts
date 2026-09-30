export type StatusProcessamento = 'pronto' | 'analisando' | 'pendente' | 'erro'

export type FormatoVideo = 'MP4' | 'MOV' | 'MKV' | 'AVI'

export interface Evidencia {
  codigo: string
  dataRegistro: Date
  statusProcessamento: StatusProcessamento
  formatoVideo: FormatoVideo
  duracao: string
  urlMiniatura?: string
}

export interface AparenciaStatus {
  rotulo: string
  classeIcone: string
  classesCor: string
}

export interface OpcaoStatusProcessamento {
  rotulo: string
  valor: StatusProcessamento
}

export const APARENCIA_POR_STATUS: Record<StatusProcessamento, AparenciaStatus> = {
  pronto: {
    rotulo: 'Pronto',
    classeIcone: 'pi pi-check-circle',
    classesCor: 'bg-green-50 text-green-700 border-green-200',
  },
  analisando: {
    rotulo: 'Analisando',
    classeIcone: 'pi pi-sync',
    classesCor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  pendente: {
    rotulo: 'Pendente',
    classeIcone: 'pi pi-clock',
    classesCor: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  erro: {
    rotulo: 'Erro',
    classeIcone: 'pi pi-times-circle',
    classesCor: 'bg-red-50 text-red-700 border-red-200',
  },
}

export const OPCOES_STATUS_PROCESSAMENTO: OpcaoStatusProcessamento[] = (
  Object.keys(APARENCIA_POR_STATUS) as StatusProcessamento[]
).map((status) => ({ rotulo: APARENCIA_POR_STATUS[status].rotulo, valor: status }))
