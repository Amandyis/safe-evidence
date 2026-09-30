import { Injectable, signal } from '@angular/core'
import { Evidencia } from '../shared/models/evidencia.model'
import {
  EvidenciaDetalhada,
  MetadadosArquivo,
  RelatorioAnaliseIa,
} from '../shared/models/evidencia-detalhada.model'
import { converterDuracaoParaSegundos } from '../shared/utils/formatadores'

const RELATORIO_ANALISE_IA_EXEMPLO: RelatorioAnaliseIa = {
  indiceProbabilidadeAgressao: 94,
  intensidadesPorIntervalo: [
    12, 15, 10, 18, 35, 45, 70, 80, 72, 40, 15, 12, 14, 10, 18, 25, 55, 75, 68, 45, 15, 18, 12, 8,
  ],
}

const DISPOSITIVO_CAPTURA_EXEMPLO = {
  nomeDispositivo: 'Ring Stick Up Cam Gen 3',
  identificadorDispositivo: '#88219-X',
}

/**
 * Fonte de dados das evidências.
 * Por enquanto usa dados de exemplo; depois basta trocar pela chamada HTTP da API.
 */
@Injectable({ providedIn: 'root' })
export class EvidenciaService {
  private readonly evidenciasCadastradas = signal<Evidencia[]>([
    {
      codigo: 'EVID-2023-08912',
      dataRegistro: new Date(2023, 9, 12, 23, 14),
      statusProcessamento: 'pronto',
      formatoVideo: 'MP4',
      duracao: '04:22',
    },
    {
      codigo: 'EVID-2023-08915',
      dataRegistro: new Date(2023, 9, 13, 4, 52),
      statusProcessamento: 'analisando',
      formatoVideo: 'MOV',
      duracao: '01:15',
    },
    {
      codigo: 'EVID-2023-08919',
      dataRegistro: new Date(2023, 9, 14, 10, 2),
      statusProcessamento: 'pendente',
      formatoVideo: 'MKV',
      duracao: '12:40',
    },
    {
      codigo: 'EVID-2023-08922',
      dataRegistro: new Date(2023, 9, 14, 15, 44),
      statusProcessamento: 'pronto',
      formatoVideo: 'MP4',
      duracao: '08:05',
    },
    {
      codigo: 'EVID-2023-08930',
      dataRegistro: new Date(2023, 9, 15, 9, 12),
      statusProcessamento: 'erro',
      formatoVideo: 'AVI',
      duracao: '02:45',
    },
    {
      codigo: 'EVID-2023-08933',
      dataRegistro: new Date(2023, 9, 15, 11, 30),
      statusProcessamento: 'pronto',
      formatoVideo: 'MP4',
      duracao: '05:30',
    },
    {
      codigo: 'EVID-2023-08940',
      dataRegistro: new Date(2023, 9, 16, 8, 20),
      statusProcessamento: 'pronto',
      formatoVideo: 'MOV',
      duracao: '02:18',
    },
  ])

  readonly evidencias = this.evidenciasCadastradas.asReadonly()

  buscarEvidenciaDetalhada(codigoEvidencia: string): EvidenciaDetalhada | undefined {
    const evidenciaEncontrada = this.evidencias().find(
      (evidencia) => evidencia.codigo === codigoEvidencia,
    )
    if (!evidenciaEncontrada) return undefined

    const isAnaliseConcluida = evidenciaEncontrada.statusProcessamento === 'pronto'

    return {
      evidencia: evidenciaEncontrada,
      duracaoEmSegundos: converterDuracaoParaSegundos(evidenciaEncontrada.duracao),
      relatorioAnaliseIa: isAnaliseConcluida ? RELATORIO_ANALISE_IA_EXEMPLO : null,
      metadadosArquivo: this.montarMetadadosArquivo(evidenciaEncontrada),
    }
  }

  excluirEvidencia(codigoEvidencia: string) {
    this.evidenciasCadastradas.update((evidencias) =>
      evidencias.filter((evidencia) => evidencia.codigo !== codigoEvidencia),
    )
  }

  private montarMetadadosArquivo(evidencia: Evidencia): MetadadosArquivo {
    return {
      nomeOriginal: this.gerarNomeOriginalArquivo(evidencia),
      dataCaptura: evidencia.dataRegistro,
      ...DISPOSITIVO_CAPTURA_EXEMPLO,
      isIntegridadeVerificada: evidencia.statusProcessamento !== 'erro',
    }
  }

  private gerarNomeOriginalArquivo(evidencia: Evidencia): string {
    const dataCaptura = evidencia.dataRegistro
    const completarComZero = (valor: number) => String(valor).padStart(2, '0')
    const dataFormatada = `${dataCaptura.getFullYear()}${completarComZero(dataCaptura.getMonth() + 1)}${completarComZero(dataCaptura.getDate())}`
    const horaFormatada = `${completarComZero(dataCaptura.getHours())}${completarComZero(dataCaptura.getMinutes())}`
    return `CAM_04_${dataFormatada}_${horaFormatada}.${evidencia.formatoVideo.toLowerCase()}`
  }
}
