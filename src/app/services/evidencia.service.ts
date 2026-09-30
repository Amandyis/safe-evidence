import { Injectable, signal } from '@angular/core'
import { Evidencia } from '../shared/models/evidencia.model'

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
}
