import { Component, computed, input } from '@angular/core'
import {
  CLASSE_COR_POR_INTENSIDADE,
  SegmentoCritico,
  classificarIntensidade,
} from '../../models/evidencia-detalhada.model'
import { formatarPercentual, formatarSegundosComoDuracao } from '../../utils/formatadores'

interface BarraIntervalo {
  alturaPercentual: number
  classeCor: string
  descricao: string
}

const QUANTIDADE_INTERVALOS = 24
const QUANTIDADE_MARCACOES_TEMPO = 5
const ALTURA_MINIMA_BARRA_PERCENTUAL = 6

@Component({
  selector: 'app-linha-tempo-agressividade',
  templateUrl: './linha-tempo-agressividade.html',
  styleUrl: './linha-tempo-agressividade.scss',
})
export class LinhaTempoAgressividade {
  readonly segmentosCriticos = input.required<SegmentoCritico[]>()
  readonly duracaoEmSegundos = input.required<number>()

  protected readonly barrasIntervalo = computed<BarraIntervalo[]>(() => {
    const duracaoIntervaloEmSegundos = this.duracaoEmSegundos() / QUANTIDADE_INTERVALOS

    return Array.from({ length: QUANTIDADE_INTERVALOS }, (_, posicaoIntervalo) => {
      const inicioIntervalo = posicaoIntervalo * duracaoIntervaloEmSegundos
      const fimIntervalo = inicioIntervalo + duracaoIntervaloEmSegundos
      const maiorScoreNoIntervalo = this.calcularMaiorScoreEntre(inicioIntervalo, fimIntervalo)

      return {
        alturaPercentual: Math.max(maiorScoreNoIntervalo, ALTURA_MINIMA_BARRA_PERCENTUAL),
        classeCor: CLASSE_COR_POR_INTENSIDADE[classificarIntensidade(maiorScoreNoIntervalo)],
        descricao: this.descreverIntervalo(inicioIntervalo, fimIntervalo, maiorScoreNoIntervalo),
      }
    })
  })

  protected readonly marcacoesTempo = computed(() => {
    const ultimaMarcacao = QUANTIDADE_MARCACOES_TEMPO - 1
    return Array.from({ length: QUANTIDADE_MARCACOES_TEMPO }, (_, posicaoMarcacao) =>
      formatarSegundosComoDuracao((this.duracaoEmSegundos() * posicaoMarcacao) / ultimaMarcacao),
    )
  })

  protected readonly trechosCriticosFormatados = computed(() =>
    this.segmentosCriticos().map((segmento) => ({
      periodo: `${formatarSegundosComoDuracao(segmento.inicioEmSegundos)} – ${formatarSegundosComoDuracao(segmento.fimEmSegundos)}`,
      score: formatarPercentual(segmento.score),
    })),
  )

  protected readonly resumoAcessivel = computed(() => {
    const quantidadeTrechos = this.segmentosCriticos().length
    return quantidadeTrechos === 0
      ? 'Gráfico de agressividade: nenhum trecho crítico identificado.'
      : `Gráfico de agressividade: ${quantidadeTrechos} trechos críticos identificados.`
  })

  private calcularMaiorScoreEntre(inicioIntervalo: number, fimIntervalo: number): number {
    const scoresSobrepostos = this.segmentosCriticos()
      .filter(
        (segmento) =>
          segmento.inicioEmSegundos < fimIntervalo && segmento.fimEmSegundos > inicioIntervalo,
      )
      .map((segmento) => segmento.score)
    return scoresSobrepostos.length > 0 ? Math.max(...scoresSobrepostos) : 0
  }

  private descreverIntervalo(inicio: number, fim: number, maiorScore: number): string {
    const periodo = `${formatarSegundosComoDuracao(inicio)}–${formatarSegundosComoDuracao(fim)}`
    return maiorScore > 0
      ? `${periodo}: score ${formatarPercentual(maiorScore)}%`
      : `${periodo}: sem ocorrências`
  }
}
