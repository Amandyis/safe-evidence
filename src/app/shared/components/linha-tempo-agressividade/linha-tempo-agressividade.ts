import { Component, computed, input } from '@angular/core'
import {
  CLASSE_COR_POR_INTENSIDADE,
  ClassificacaoIntensidade,
  SegmentoCritico,
  TrechoLinhaTempo,
  classificarIntensidade,
} from '../../models/evidencia-detalhada.model'
import { formatarPercentual, formatarSegundosComoDuracao } from '../../utils/formatadores'

interface BarraIntervalo {
  alturaPercentual: number
  classeCor: string
  descricao: string
}

interface MedicaoIntervalo {
  maiorScore: number
  nivel: ClassificacaoIntensidade
}

const QUANTIDADE_INTERVALOS = 24
const QUANTIDADE_MARCACOES_TEMPO = 5
const ALTURA_MINIMA_BARRA_PERCENTUAL = 6

const PESO_POR_NIVEL: Record<ClassificacaoIntensidade, number> = {
  normal: 0,
  alerta: 1,
  critico: 2,
}

@Component({
  selector: 'app-linha-tempo-agressividade',
  templateUrl: './linha-tempo-agressividade.html',
  styleUrl: './linha-tempo-agressividade.scss',
})
export class LinhaTempoAgressividade {
  readonly segmentosCriticos = input.required<SegmentoCritico[]>()
  readonly linhaDoTempo = input<TrechoLinhaTempo[]>([])
  readonly duracaoEmSegundos = input<number | null>(null)

  protected readonly isBaseadaNaLinhaDoTempo = computed(() => this.linhaDoTempo().length > 0)

  protected readonly duracaoConsiderada = computed(() => {
    const duracaoInformada = this.duracaoEmSegundos()
    if (duracaoInformada !== null && duracaoInformada > 0) return duracaoInformada

    const fimDosTrechos = [...this.linhaDoTempo(), ...this.segmentosCriticos()].map(
      (trecho) => trecho.fimEmSegundos,
    )
    return fimDosTrechos.length > 0 ? Math.max(...fimDosTrechos) : 0
  })

  protected readonly barrasIntervalo = computed<BarraIntervalo[]>(() => {
    const duracaoIntervaloEmSegundos = this.duracaoConsiderada() / QUANTIDADE_INTERVALOS

    return Array.from({ length: QUANTIDADE_INTERVALOS }, (_, posicaoIntervalo) => {
      const inicioIntervalo = posicaoIntervalo * duracaoIntervaloEmSegundos
      const fimIntervalo = inicioIntervalo + duracaoIntervaloEmSegundos
      const medicao = this.medirIntervalo(inicioIntervalo, fimIntervalo)

      return {
        alturaPercentual: Math.max(medicao.maiorScore, ALTURA_MINIMA_BARRA_PERCENTUAL),
        classeCor: CLASSE_COR_POR_INTENSIDADE[medicao.nivel],
        descricao: this.descreverIntervalo(inicioIntervalo, fimIntervalo, medicao.maiorScore),
      }
    })
  })

  protected readonly marcacoesTempo = computed(() => {
    const ultimaMarcacao = QUANTIDADE_MARCACOES_TEMPO - 1
    return Array.from({ length: QUANTIDADE_MARCACOES_TEMPO }, (_, posicaoMarcacao) =>
      formatarSegundosComoDuracao((this.duracaoConsiderada() * posicaoMarcacao) / ultimaMarcacao),
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

  private medirIntervalo(inicioIntervalo: number, fimIntervalo: number): MedicaoIntervalo {
    const sobrepoeIntervalo = (trecho: { inicioEmSegundos: number; fimEmSegundos: number }) =>
      trecho.inicioEmSegundos < fimIntervalo && trecho.fimEmSegundos > inicioIntervalo

    if (this.isBaseadaNaLinhaDoTempo()) {
      const trechosSobrepostos = this.linhaDoTempo().filter(sobrepoeIntervalo)
      const maiorScore = Math.max(0, ...trechosSobrepostos.map((trecho) => trecho.score))
      const nivel = trechosSobrepostos.reduce<ClassificacaoIntensidade>(
        (nivelAtual, trecho) =>
          PESO_POR_NIVEL[trecho.nivel] > PESO_POR_NIVEL[nivelAtual] ? trecho.nivel : nivelAtual,
        'normal',
      )
      return { maiorScore, nivel }
    }

    const scoresSobrepostos = this.segmentosCriticos()
      .filter(sobrepoeIntervalo)
      .map((segmento) => segmento.score)
    const maiorScore = Math.max(0, ...scoresSobrepostos)
    return { maiorScore, nivel: classificarIntensidade(maiorScore) }
  }

  private descreverIntervalo(inicio: number, fim: number, maiorScore: number): string {
    const periodo = `${formatarSegundosComoDuracao(inicio)}–${formatarSegundosComoDuracao(fim)}`
    return maiorScore > 0
      ? `${periodo}: score ${formatarPercentual(maiorScore)}%`
      : `${periodo}: sem ocorrências`
  }
}
