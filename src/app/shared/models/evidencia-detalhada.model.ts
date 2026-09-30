import { Evidencia } from './evidencia.model'

export type NivelRisco = 'baixo' | 'moderado' | 'alto' | 'critico'

export type ClassificacaoIntensidade = 'normal' | 'alerta' | 'critico'

export interface RelatorioAnaliseIa {
  indiceProbabilidadeAgressao: number
  intensidadesPorIntervalo: number[]
}

export interface MetadadosArquivo {
  nomeOriginal: string
  dataCaptura: Date
  nomeDispositivo: string
  identificadorDispositivo: string
  isIntegridadeVerificada: boolean
}

export interface EvidenciaDetalhada {
  evidencia: Evidencia
  duracaoEmSegundos: number
  urlVideo?: string
  relatorioAnaliseIa: RelatorioAnaliseIa | null
  metadadosArquivo: MetadadosArquivo
}

export interface AparenciaNivelRisco {
  rotulo: string
  classesSelo: string
  classeCorBarra: string
}

export const APARENCIA_POR_NIVEL_RISCO: Record<NivelRisco, AparenciaNivelRisco> = {
  baixo: {
    rotulo: 'Nível baixo',
    classesSelo: 'bg-green-600 text-white',
    classeCorBarra: 'bg-green-500',
  },
  moderado: {
    rotulo: 'Nível moderado',
    classesSelo: 'bg-amber-500 text-gray-900',
    classeCorBarra: 'bg-amber-400',
  },
  alto: {
    rotulo: 'Nível alto',
    classesSelo: 'bg-orange-600 text-white',
    classeCorBarra: 'bg-orange-500',
  },
  critico: {
    rotulo: 'Nível crítico',
    classesSelo: 'bg-red-700 text-white',
    classeCorBarra: 'bg-red-600',
  },
}

export const CLASSE_COR_POR_INTENSIDADE: Record<ClassificacaoIntensidade, string> = {
  normal: 'bg-slate-200',
  alerta: 'bg-amber-400',
  critico: 'bg-red-700',
}

const INDICE_MINIMO_RISCO_CRITICO = 85
const INDICE_MINIMO_RISCO_ALTO = 70
const INDICE_MINIMO_RISCO_MODERADO = 40

const INTENSIDADE_MINIMA_CRITICA = 60
const INTENSIDADE_MINIMA_ALERTA = 35

export function classificarNivelRisco(indiceProbabilidade: number): NivelRisco {
  if (indiceProbabilidade >= INDICE_MINIMO_RISCO_CRITICO) return 'critico'
  if (indiceProbabilidade >= INDICE_MINIMO_RISCO_ALTO) return 'alto'
  if (indiceProbabilidade >= INDICE_MINIMO_RISCO_MODERADO) return 'moderado'
  return 'baixo'
}

export function classificarIntensidade(intensidade: number): ClassificacaoIntensidade {
  if (intensidade >= INTENSIDADE_MINIMA_CRITICA) return 'critico'
  if (intensidade >= INTENSIDADE_MINIMA_ALERTA) return 'alerta'
  return 'normal'
}
