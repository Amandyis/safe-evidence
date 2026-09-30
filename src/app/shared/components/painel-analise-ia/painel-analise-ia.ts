import { Component, computed, input } from '@angular/core'
import {
  APARENCIA_POR_STATUS_ANALISE,
  APARENCIA_POR_VEREDICTO,
  StatusAnalise,
} from '../../models/evidencia.model'
import { Laudo } from '../../models/evidencia-detalhada.model'
import { formatarPercentual } from '../../utils/formatadores'

const MENSAGEM_SEM_LAUDO_POR_STATUS: Record<StatusAnalise, string> = {
  Pendente: 'A evidência está na fila para análise automática.',
  Processando: 'A análise está em andamento. Esta tela será atualizada automaticamente.',
  Concluido: 'O laudo desta evidência ainda não está disponível.',
  Erro: 'Não foi possível concluir a análise automática desta evidência.',
}

@Component({
  selector: 'app-painel-analise-ia',
  templateUrl: './painel-analise-ia.html',
  styleUrl: './painel-analise-ia.scss',
})
export class PainelAnaliseIa {
  readonly laudo = input.required<Laudo | null>()
  readonly statusAnalise = input.required<StatusAnalise>()
  readonly ultimoErroAnalise = input<string | null>(null)

  protected readonly rotuloStatus = computed(
    () => APARENCIA_POR_STATUS_ANALISE[this.statusAnalise()].rotulo,
  )

  protected readonly aparenciaVeredicto = computed(() => {
    const laudoAtual = this.laudo()
    return laudoAtual ? APARENCIA_POR_VEREDICTO[laudoAtual.veredicto] : null
  })

  protected readonly indiceProbabilidadeFormatado = computed(() => {
    const laudoAtual = this.laudo()
    return laudoAtual ? formatarPercentual(laudoAtual.indiceProbabilidade) : ''
  })

  protected readonly mensagemSemLaudo = computed(
    () => MENSAGEM_SEM_LAUDO_POR_STATUS[this.statusAnalise()],
  )
}
