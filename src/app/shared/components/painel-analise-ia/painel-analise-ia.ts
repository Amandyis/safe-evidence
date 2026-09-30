import { Component, computed, input } from '@angular/core'
import { APARENCIA_POR_STATUS, StatusProcessamento } from '../../models/evidencia.model'
import {
  APARENCIA_POR_NIVEL_RISCO,
  RelatorioAnaliseIa,
  classificarNivelRisco,
} from '../../models/evidencia-detalhada.model'

@Component({
  selector: 'app-painel-analise-ia',
  templateUrl: './painel-analise-ia.html',
  styleUrl: './painel-analise-ia.scss',
})
export class PainelAnaliseIa {
  readonly relatorioAnaliseIa = input.required<RelatorioAnaliseIa | null>()
  readonly statusProcessamento = input.required<StatusProcessamento>()

  protected readonly rotuloStatus = computed(
    () => APARENCIA_POR_STATUS[this.statusProcessamento()].rotulo,
  )

  protected readonly aparenciaNivelRisco = computed(() => {
    const relatorio = this.relatorioAnaliseIa()
    if (!relatorio) return null
    return APARENCIA_POR_NIVEL_RISCO[classificarNivelRisco(relatorio.indiceProbabilidadeAgressao)]
  })
}
