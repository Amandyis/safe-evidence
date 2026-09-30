import { Component, computed, input } from '@angular/core'
import { DatePipe } from '@angular/common'
import { APARENCIA_POR_STATUS, StatusProcessamento } from '../../models/evidencia.model'
import { MetadadosArquivo } from '../../models/evidencia-detalhada.model'

@Component({
  selector: 'app-tabela-metadados-arquivo',
  imports: [DatePipe],
  templateUrl: './tabela-metadados-arquivo.html',
  styleUrl: './tabela-metadados-arquivo.scss',
})
export class TabelaMetadadosArquivo {
  readonly metadadosArquivo = input.required<MetadadosArquivo>()
  readonly statusProcessamento = input.required<StatusProcessamento>()

  protected readonly rotuloStatus = computed(
    () => APARENCIA_POR_STATUS[this.statusProcessamento()].rotulo,
  )
}
