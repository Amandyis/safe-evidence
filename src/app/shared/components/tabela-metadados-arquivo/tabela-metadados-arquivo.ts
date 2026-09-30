import { Component, computed, input, output } from '@angular/core'
import { DatePipe } from '@angular/common'
import { APARENCIA_POR_STATUS_ANALISE } from '../../models/evidencia.model'
import { EvidenciaDetalhada } from '../../models/evidencia-detalhada.model'
import { formatarSegundosComoDuracao } from '../../utils/formatadores'

@Component({
  selector: 'app-tabela-metadados-arquivo',
  imports: [DatePipe],
  templateUrl: './tabela-metadados-arquivo.html',
  styleUrl: './tabela-metadados-arquivo.scss',
})
export class TabelaMetadadosArquivo {
  readonly evidenciaDetalhada = input.required<EvidenciaDetalhada>()
  readonly isIntegridadeConfirmada = input<boolean | null>(null)
  readonly isVerificandoIntegridade = input(false)

  readonly verificacaoIntegridadeSolicitada = output<void>()

  protected readonly rotuloStatusAnalise = computed(
    () => APARENCIA_POR_STATUS_ANALISE[this.evidenciaDetalhada().evidencia.statusAnalise].rotulo,
  )

  protected readonly duracaoFormatada = computed(() =>
    formatarSegundosComoDuracao(this.evidenciaDetalhada().evidencia.duracaoEmSegundos),
  )

  protected solicitarVerificacaoIntegridade() {
    this.verificacaoIntegridadeSolicitada.emit()
  }
}
