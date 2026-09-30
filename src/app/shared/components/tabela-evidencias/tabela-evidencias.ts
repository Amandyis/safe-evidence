import { Component, computed, inject, signal, viewChild } from '@angular/core'
import { DatePipe } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { MenuItem } from 'primeng/api'
import { DatePickerModule } from 'primeng/datepicker'
import { IconFieldModule } from 'primeng/iconfield'
import { InputTextModule } from 'primeng/inputtext'
import { Menu, MenuModule } from 'primeng/menu'
import { SelectModule } from 'primeng/select'
import { EvidenciaService } from '../../../services/evidencia.service'
import {
  APARENCIA_POR_STATUS,
  Evidencia,
  OPCOES_STATUS_PROCESSAMENTO,
  StatusProcessamento,
} from '../../models/evidencia.model'

@Component({
  selector: 'app-tabela-evidencias',
  imports: [
    DatePipe,
    FormsModule,
    DatePickerModule,
    IconFieldModule,
    InputTextModule,
    MenuModule,
    SelectModule,
  ],
  templateUrl: './tabela-evidencias.html',
  styleUrl: './tabela-evidencias.scss',
})
export class TabelaEvidencias {
  private readonly evidenciaService = inject(EvidenciaService)
  private readonly router = inject(Router)
  private readonly menuOpcoesEvidencia = viewChild.required<Menu>('menuOpcoesEvidencia')

  protected readonly aparenciaPorStatus = APARENCIA_POR_STATUS
  protected readonly opcoesStatusProcessamento = OPCOES_STATUS_PROCESSAMENTO

  protected readonly termoPesquisa = signal('')
  protected readonly periodoRegistro = signal<Date[] | null>(null)
  protected readonly statusSelecionado = signal<StatusProcessamento | null>(null)
  protected readonly isPainelFiltrosVisivel = signal(false)
  private readonly evidenciaComMenuAberto = signal<Evidencia | null>(null)

  protected readonly itensMenuOpcoes: MenuItem[] = [
    {
      label: 'Visualizar detalhes',
      icon: 'pi pi-eye',
      command: () => this.visualizarDetalhes(),
    },
    {
      label: 'Baixar arquivo',
      icon: 'pi pi-download',
      command: () => this.baixarArquivo(),
    },
  ]

  protected readonly quantidadeFiltrosAtivos = computed(() => {
    const isPeriodoPreenchido = this.periodoRegistro()?.[0] != null
    const isStatusPreenchido = this.statusSelecionado() !== null
    return [isPeriodoPreenchido, isStatusPreenchido].filter(Boolean).length
  })

  protected readonly evidenciasFiltradas = computed(() =>
    this.evidenciaService
      .evidencias()
      .filter(
        (evidencia) =>
          this.correspondeAoTermoPesquisado(evidencia) &&
          this.correspondeAoStatusSelecionado(evidencia) &&
          this.estaDentroDoPeriodoRegistro(evidencia),
      ),
  )

  protected alternarPainelFiltros() {
    this.isPainelFiltrosVisivel.update((isVisivel) => !isVisivel)
  }

  protected limparFiltros() {
    this.termoPesquisa.set('')
    this.periodoRegistro.set(null)
    this.statusSelecionado.set(null)
  }

  protected abrirMenuOpcoes(eventoClique: MouseEvent, evidencia: Evidencia) {
    this.evidenciaComMenuAberto.set(evidencia)
    this.menuOpcoesEvidencia().toggle(eventoClique)
  }

  protected reproduzirVideo(evidencia: Evidencia) {
    this.abrirDetalhesEvidencia(evidencia.codigo)
  }

  private visualizarDetalhes() {
    const evidenciaSelecionada = this.evidenciaComMenuAberto()
    if (evidenciaSelecionada) {
      this.abrirDetalhesEvidencia(evidenciaSelecionada.codigo)
    }
  }

  private abrirDetalhesEvidencia(codigoEvidencia: string) {
    this.router.navigate(['/evidencias', codigoEvidencia])
  }

  private baixarArquivo() {
    // TODO: chamar o download seguro da evidência
    console.log('baixar arquivo da evidência:', this.evidenciaComMenuAberto()?.codigo)
  }

  private correspondeAoTermoPesquisado(evidencia: Evidencia): boolean {
    const termoNormalizado = this.termoPesquisa().trim().toLowerCase()
    if (!termoNormalizado) return true

    return (
      evidencia.codigo.toLowerCase().includes(termoNormalizado) ||
      evidencia.formatoVideo.toLowerCase().includes(termoNormalizado)
    )
  }

  private correspondeAoStatusSelecionado(evidencia: Evidencia): boolean {
    const statusFiltrado = this.statusSelecionado()
    return statusFiltrado === null || evidencia.statusProcessamento === statusFiltrado
  }

  private estaDentroDoPeriodoRegistro(evidencia: Evidencia): boolean {
    const [dataInicial, dataFinal] = this.periodoRegistro() ?? []
    if (!dataInicial) return true

    const inicioDoPeriodo = new Date(dataInicial)
    inicioDoPeriodo.setHours(0, 0, 0, 0)

    const fimDoPeriodo = new Date(dataFinal ?? dataInicial)
    fimDoPeriodo.setHours(23, 59, 59, 999)

    return evidencia.dataRegistro >= inicioDoPeriodo && evidencia.dataRegistro <= fimDoPeriodo
  }
}
