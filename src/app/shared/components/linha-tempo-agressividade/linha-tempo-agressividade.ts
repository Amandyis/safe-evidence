import { Component, computed, input } from '@angular/core'
import {
  CLASSE_COR_POR_INTENSIDADE,
  ClassificacaoIntensidade,
  classificarIntensidade,
} from '../../models/evidencia-detalhada.model'
import { formatarSegundosComoDuracao } from '../../utils/formatadores'

interface BarraIntervalo {
  alturaPercentual: number
  classeCor: string
  descricao: string
}

const QUANTIDADE_MARCACOES_TEMPO = 5
const ALTURA_MINIMA_BARRA_PERCENTUAL = 4

@Component({
  selector: 'app-linha-tempo-agressividade',
  templateUrl: './linha-tempo-agressividade.html',
  styleUrl: './linha-tempo-agressividade.scss',
})
export class LinhaTempoAgressividade {
  readonly intensidadesPorIntervalo = input.required<number[]>()
  readonly duracaoEmSegundos = input.required<number>()

  protected readonly barrasIntervalo = computed<BarraIntervalo[]>(() => {
    const intensidades = this.intensidadesPorIntervalo()
    const duracaoIntervaloEmSegundos = this.duracaoEmSegundos() / intensidades.length

    return intensidades.map((intensidade, posicaoIntervalo) => {
      const inicioIntervalo = formatarSegundosComoDuracao(
        Math.round(posicaoIntervalo * duracaoIntervaloEmSegundos),
      )
      return {
        alturaPercentual: Math.max(intensidade, ALTURA_MINIMA_BARRA_PERCENTUAL),
        classeCor: CLASSE_COR_POR_INTENSIDADE[classificarIntensidade(intensidade)],
        descricao: `${inicioIntervalo} — intensidade ${intensidade}%`,
      }
    })
  })

  protected readonly marcacoesTempo = computed(() => {
    const ultimaMarcacao = QUANTIDADE_MARCACOES_TEMPO - 1
    return Array.from({ length: QUANTIDADE_MARCACOES_TEMPO }, (_, posicaoMarcacao) =>
      formatarSegundosComoDuracao(
        Math.round((this.duracaoEmSegundos() * posicaoMarcacao) / ultimaMarcacao),
      ),
    )
  })

  protected readonly resumoAcessivel = computed(() => {
    const classificacoes = this.intensidadesPorIntervalo().map(classificarIntensidade)
    const contarIntervalos = (classificacao: ClassificacaoIntensidade) =>
      classificacoes.filter((classificacaoIntervalo) => classificacaoIntervalo === classificacao)
        .length
    return `Gráfico de agressividade: ${contarIntervalos('critico')} intervalos críticos e ${contarIntervalos('alerta')} intervalos de alerta.`
  })
}
