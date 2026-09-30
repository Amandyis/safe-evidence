import { Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core'
import { DatePipe } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { finalize } from 'rxjs'
import { MenuItem } from 'primeng/api'
import { DatePickerModule } from 'primeng/datepicker'
import { IconFieldModule } from 'primeng/iconfield'
import { InputTextModule } from 'primeng/inputtext'
import { Menu, MenuModule } from 'primeng/menu'
import { SelectModule } from 'primeng/select'
import { EvidenciaService } from '../../../services/evidencia.service'
import {
  APARENCIA_POR_STATUS_ANALISE,
  APARENCIA_POR_VEREDICTO,
  Evidencia,
  EventoStatusAnaliseApi,
  OPCOES_STATUS_ANALISE,
  StatusAnalise,
} from '../../models/evidencia.model'
import { iniciarDownloadPorUrl } from '../../utils/download-arquivo'
import { interpretarErroApi } from '../../utils/erro-api'
import { formatarSegundosComoDuracao } from '../../utils/formatadores'
import { MensagemAlerta } from '../mensagem-alerta/mensagem-alerta'

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
    MensagemAlerta,
  ],
  templateUrl: './tabela-evidencias.html',
  styleUrl: './tabela-evidencias.scss',
})
export class TabelaEvidencias {
  private readonly evidenciaService = inject(EvidenciaService)
  private readonly router = inject(Router)
  private readonly menuOpcoesEvidencia = viewChild.required<Menu>('menuOpcoesEvidencia')

  protected readonly aparenciaPorStatus = APARENCIA_POR_STATUS_ANALISE
  protected readonly aparenciaPorVeredicto = APARENCIA_POR_VEREDICTO
  protected readonly opcoesStatusAnalise = OPCOES_STATUS_ANALISE
  protected readonly formatarDuracao = formatarSegundosComoDuracao

  protected readonly evidencias = signal<Evidencia[]>([])
  protected readonly isCarregando = signal(true)
  protected readonly mensagemErroCarregamento = signal<string | null>(null)
  protected readonly mensagemErroAcao = signal<string | null>(null)

  protected readonly termoPesquisa = signal('')
  protected readonly periodoGravacao = signal<Date[] | null>(null)
  protected readonly statusSelecionado = signal<StatusAnalise | null>(null)
  protected readonly isPainelFiltrosVisivel = signal(false)
  private readonly evidenciaComMenuAberto = signal<Evidencia | null>(null)

  protected readonly itensMenuOpcoes: MenuItem[] = [
    {
      label: 'Visualizar detalhes',
      icon: 'pi pi-eye',
      command: () => this.visualizarDetalhes(),
    },
    {
      label: 'Baixar vídeo',
      icon: 'pi pi-download',
      command: () => this.baixarVideo(),
    },
  ]

  protected readonly quantidadeFiltrosAtivos = computed(() => {
    const isPeriodoPreenchido = this.periodoGravacao()?.[0] != null
    const isStatusPreenchido = this.statusSelecionado() !== null
    return [isPeriodoPreenchido, isStatusPreenchido].filter(Boolean).length
  })

  protected readonly evidenciasFiltradas = computed(() =>
    this.evidencias().filter(
      (evidencia) =>
        this.correspondeAoTermoPesquisado(evidencia) &&
        this.correspondeAoStatusSelecionado(evidencia) &&
        this.estaDentroDoPeriodoGravacao(evidencia),
    ),
  )

  constructor() {
    this.carregarEvidencias()

    const pararEscutaDeStatus = this.evidenciaService.escutarAtualizacoesDeStatus(
      (atualizacao) => this.aplicarAtualizacaoDeStatus(atualizacao),
    )
    inject(DestroyRef).onDestroy(pararEscutaDeStatus)
  }

  protected carregarEvidencias() {
    this.isCarregando.set(true)
    this.mensagemErroCarregamento.set(null)

    this.evidenciaService
      .listarEvidencias()
      .pipe(finalize(() => this.isCarregando.set(false)))
      .subscribe({
        next: (evidenciasRecebidas) => this.evidencias.set(evidenciasRecebidas),
        error: (erro: unknown) =>
          this.mensagemErroCarregamento.set(interpretarErroApi(erro).mensagem),
      })
  }

  protected alternarPainelFiltros() {
    this.isPainelFiltrosVisivel.update((isVisivel) => !isVisivel)
  }

  protected limparFiltros() {
    this.termoPesquisa.set('')
    this.periodoGravacao.set(null)
    this.statusSelecionado.set(null)
  }

  protected abrirMenuOpcoes(eventoClique: MouseEvent, evidencia: Evidencia) {
    this.evidenciaComMenuAberto.set(evidencia)
    this.menuOpcoesEvidencia().toggle(eventoClique)
  }

  protected abrirDetalhesEvidencia(evidencia: Evidencia) {
    this.router.navigate(['/evidencias', evidencia.idGravacao])
  }

  private visualizarDetalhes() {
    const evidenciaSelecionada = this.evidenciaComMenuAberto()
    if (evidenciaSelecionada) this.abrirDetalhesEvidencia(evidenciaSelecionada)
  }

  private baixarVideo() {
    const evidenciaSelecionada = this.evidenciaComMenuAberto()
    if (!evidenciaSelecionada) return

    this.mensagemErroAcao.set(null)
    this.evidenciaService.obterUrlTemporariaVideo(evidenciaSelecionada.idGravacao).subscribe({
      next: (urlVideo) => iniciarDownloadPorUrl(urlVideo, `${evidenciaSelecionada.codigo}.mp4`),
      error: (erro: unknown) => this.mensagemErroAcao.set(interpretarErroApi(erro).mensagem),
    })
  }

  private aplicarAtualizacaoDeStatus(atualizacao: EventoStatusAnaliseApi) {
    this.evidencias.update((evidenciasAtuais) =>
      evidenciasAtuais.map((evidencia) =>
        evidencia.idGravacao === atualizacao.id_gravacao
          ? {
              ...evidencia,
              statusAnalise: atualizacao.status_analise,
              veredicto: atualizacao.veredicto,
              score: atualizacao.score,
            }
          : evidencia,
      ),
    )
  }

  private correspondeAoTermoPesquisado(evidencia: Evidencia): boolean {
    const termoNormalizado = this.termoPesquisa().trim().toLowerCase()
    if (!termoNormalizado) return true

    const textosPesquisaveis = [evidencia.codigo, evidencia.dispositivo, evidencia.veredicto ?? '']
    return textosPesquisaveis.some((texto) => texto.toLowerCase().includes(termoNormalizado))
  }

  private correspondeAoStatusSelecionado(evidencia: Evidencia): boolean {
    const statusFiltrado = this.statusSelecionado()
    return statusFiltrado === null || evidencia.statusAnalise === statusFiltrado
  }

  private estaDentroDoPeriodoGravacao(evidencia: Evidencia): boolean {
    const [dataInicial, dataFinal] = this.periodoGravacao() ?? []
    if (!dataInicial) return true

    const inicioDoPeriodo = new Date(dataInicial)
    inicioDoPeriodo.setHours(0, 0, 0, 0)

    const fimDoPeriodo = new Date(dataFinal ?? dataInicial)
    fimDoPeriodo.setHours(23, 59, 59, 999)

    return evidencia.gravadaEm >= inicioDoPeriodo && evidencia.gravadaEm <= fimDoPeriodo
  }
}
