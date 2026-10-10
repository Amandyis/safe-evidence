import { Component, DestroyRef, computed, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { finalize, map } from 'rxjs'
import { EvidenciaService } from '../../services/evidencia.service'
import { LinhaTempoAgressividade } from '../../shared/components/linha-tempo-agressividade/linha-tempo-agressividade'
import { MensagemAlerta } from '../../shared/components/mensagem-alerta/mensagem-alerta'
import { ModalConfirmacao } from '../../shared/components/modal-confirmacao/modal-confirmacao'
import { PainelAnaliseIa } from '../../shared/components/painel-analise-ia/painel-analise-ia'
import { TabelaMetadadosArquivo } from '../../shared/components/tabela-metadados-arquivo/tabela-metadados-arquivo'
import { APARENCIA_POR_STATUS_ANALISE } from '../../shared/models/evidencia.model'
import { EvidenciaDetalhada } from '../../shared/models/evidencia-detalhada.model'
import {
  iniciarDownloadPorUrl,
  salvarArquivoNoDispositivo,
} from '../../shared/utils/download-arquivo'
import { interpretarErroApi } from '../../shared/utils/erro-api'

@Component({
  selector: 'app-detalhe-evidencia',
  imports: [
    RouterLink,
    LinhaTempoAgressividade,
    MensagemAlerta,
    ModalConfirmacao,
    PainelAnaliseIa,
    TabelaMetadadosArquivo,
  ],
  templateUrl: './detalhe-evidencia.html',
  styleUrl: './detalhe-evidencia.scss',
})
export class DetalheEvidencia {
  private readonly rotaAtiva = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly evidenciaService = inject(EvidenciaService)

  protected readonly evidenciaDetalhada = signal<EvidenciaDetalhada | null>(null)
  protected readonly isCarregando = signal(true)
  protected readonly mensagemErroCarregamento = signal<string | null>(null)
  protected readonly mensagemErroAcao = signal<string | null>(null)
  protected readonly mensagemSucessoAcao = signal<string | null>(null)

  protected readonly urlVideo = signal<string | null>(null)
  protected readonly isCarregandoVideo = signal(false)
  protected readonly isIntegridadeConfirmada = signal<boolean | null>(null)
  protected readonly isVerificandoIntegridade = signal(false)
  protected readonly isBaixandoArquivos = signal(false)
  protected readonly isSolicitandoNovaAnalise = signal(false)
  protected readonly isExcluindo = signal(false)
  protected readonly isModalExclusaoVisivel = signal(false)

  protected readonly aparenciaStatus = computed(() => {
    const detalhes = this.evidenciaDetalhada()
    return detalhes ? APARENCIA_POR_STATUS_ANALISE[detalhes.evidencia.statusAnalise] : null
  })

  private idGravacaoAtual = 0
  private isUrlVideoRenovadaAposFalha = false

  constructor() {
    this.rotaAtiva.paramMap
      .pipe(
        map((parametrosRota) => Number(parametrosRota.get('idGravacao'))),
        takeUntilDestroyed(),
      )
      .subscribe((idGravacao) => {
        this.idGravacaoAtual = idGravacao
        this.evidenciaDetalhada.set(null)
        this.urlVideo.set(null)
        this.isIntegridadeConfirmada.set(null)
        this.carregarDetalhes()
      })

    const pararEscutaDeStatus = this.evidenciaService.escutarAtualizacoesDeStatus((atualizacao) => {
      if (atualizacao.id_gravacao === this.idGravacaoAtual) this.carregarDetalhes()
    })
    inject(DestroyRef).onDestroy(pararEscutaDeStatus)
  }

  protected carregarDetalhes() {
    this.isCarregando.set(true)
    this.mensagemErroCarregamento.set(null)

    this.evidenciaService
      .buscarEvidenciaDetalhada(this.idGravacaoAtual)
      .pipe(finalize(() => this.isCarregando.set(false)))
      .subscribe({
        next: (detalhes) => {
          this.evidenciaDetalhada.set(detalhes)
          if (!this.urlVideo()) this.carregarUrlVideo()
        },
        error: (erro: unknown) =>
          this.mensagemErroCarregamento.set(interpretarErroApi(erro).mensagem),
      })
  }

  protected aoCarregarVideo() {
    this.isUrlVideoRenovadaAposFalha = false
  }

  protected aoFalharReproducaoVideo() {
    if (this.isUrlVideoRenovadaAposFalha) return
    this.isUrlVideoRenovadaAposFalha = true
    this.carregarUrlVideo()
  }

  protected baixarPacoteSeguranca() {
    const detalhes = this.evidenciaDetalhada()
    if (!detalhes) return

    this.limparMensagensAcao()
    this.isBaixandoArquivos.set(true)

    this.evidenciaService
      .obterUrlTemporariaVideo(this.idGravacaoAtual)
      .pipe(finalize(() => this.isBaixandoArquivos.set(false)))
      .subscribe({
        next: (urlTemporaria) => {
          iniciarDownloadPorUrl(urlTemporaria, `${detalhes.evidencia.codigo}.mp4`)
          if (detalhes.laudo) this.baixarLaudo()
        },
        error: (erro: unknown) => this.mensagemErroAcao.set(interpretarErroApi(erro).mensagem),
      })
  }

  protected baixarLaudo() {
    this.limparMensagensAcao()
    this.isBaixandoArquivos.set(true)

    this.evidenciaService
      .baixarLaudo(this.idGravacaoAtual)
      .pipe(finalize(() => this.isBaixandoArquivos.set(false)))
      .subscribe({
        next: (arquivoLaudo) => {
          salvarArquivoNoDispositivo(arquivoLaudo.conteudo, arquivoLaudo.nomeArquivo)
          if (arquivoLaudo.hashSha256) {
            this.mensagemSucessoAcao.set(
              `Laudo baixado. SHA-256 do arquivo: ${arquivoLaudo.hashSha256}`,
            )
          }
        },
        error: (erro: unknown) => this.mensagemErroAcao.set(interpretarErroApi(erro).mensagem),
      })
  }

  protected verificarIntegridade() {
    this.limparMensagensAcao()
    this.isVerificandoIntegridade.set(true)

    this.evidenciaService
      .verificarIntegridade(this.idGravacaoAtual)
      .pipe(finalize(() => this.isVerificandoIntegridade.set(false)))
      .subscribe({
        next: (isIntegro) => this.isIntegridadeConfirmada.set(isIntegro),
        error: (erro: unknown) => this.mensagemErroAcao.set(interpretarErroApi(erro).mensagem),
      })
  }

  protected solicitarNovaAnalise() {
    this.limparMensagensAcao()
    this.isSolicitandoNovaAnalise.set(true)

    this.evidenciaService
      .solicitarNovaAnalise(this.idGravacaoAtual)
      .pipe(finalize(() => this.isSolicitandoNovaAnalise.set(false)))
      .subscribe({
        next: () => {
          this.mensagemSucessoAcao.set('Nova análise solicitada. O status será atualizado aqui.')
          this.carregarDetalhes()
        },
        error: (erro: unknown) => this.mensagemErroAcao.set(interpretarErroApi(erro).mensagem),
      })
  }

  protected solicitarExclusaoVideo() {
    this.limparMensagensAcao()
    this.isModalExclusaoVisivel.set(true)
  }

  protected excluirVideo() {
    this.isExcluindo.set(true)

    this.evidenciaService
      .excluirEvidencia(this.idGravacaoAtual)
      .pipe(finalize(() => this.isExcluindo.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/inicio'),
        error: (erro: unknown) => this.mensagemErroAcao.set(interpretarErroApi(erro).mensagem),
      })
  }

  private carregarUrlVideo() {
    this.isCarregandoVideo.set(true)

    this.evidenciaService
      .obterUrlTemporariaVideo(this.idGravacaoAtual)
      .pipe(finalize(() => this.isCarregandoVideo.set(false)))
      .subscribe({
        next: (urlTemporaria) => this.urlVideo.set(urlTemporaria),
        error: () => this.urlVideo.set(null),
      })
  }

  private limparMensagensAcao() {
    this.mensagemErroAcao.set(null)
    this.mensagemSucessoAcao.set(null)
  }
}
