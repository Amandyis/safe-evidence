import { Component } from '@angular/core'
import {
  APARENCIA_POR_STATUS_ANALISE,
  APARENCIA_POR_VEREDICTO,
  StatusAnalise,
  Veredicto,
} from '../../shared/models/evidencia.model'
import {
  CANAIS_EMERGENCIA,
  DESCRICAO_POR_STATUS_ANALISE,
  DESCRICAO_POR_VEREDICTO,
  PERGUNTAS_FREQUENTES,
  SECOES_MANUAL,
} from './conteudo-manual'

@Component({
  selector: 'app-manual',
  templateUrl: './manual.html',
  styleUrl: './manual.scss',
})
export class Manual {
  protected readonly secoesManual = SECOES_MANUAL
  protected readonly perguntasFrequentes = PERGUNTAS_FREQUENTES
  protected readonly canaisEmergencia = CANAIS_EMERGENCIA

  protected readonly legendaStatusAnalise = (
    Object.keys(APARENCIA_POR_STATUS_ANALISE) as StatusAnalise[]
  ).map((status) => ({
    aparencia: APARENCIA_POR_STATUS_ANALISE[status],
    descricao: DESCRICAO_POR_STATUS_ANALISE[status],
  }))

  protected readonly legendaVeredicto = (Object.keys(APARENCIA_POR_VEREDICTO) as Veredicto[]).map(
    (veredicto) => ({
      aparencia: APARENCIA_POR_VEREDICTO[veredicto],
      descricao: DESCRICAO_POR_VEREDICTO[veredicto],
    }),
  )

  protected irParaSecao(idSecao: string) {
    const elementoSecao = document.getElementById(idSecao)
    elementoSecao?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    elementoSecao?.focus({ preventScroll: true })
  }
}
