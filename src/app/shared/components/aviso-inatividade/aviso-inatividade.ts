import { Component, DestroyRef, computed, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { finalize } from 'rxjs'
import { AutenticacaoService } from '../../../services/autenticacao.service'
import { SessaoService } from '../../../services/sessao.service'
import { UsuarioService } from '../../../services/usuario.service'
import { interpretarErroApi } from '../../utils/erro-api'
import { formatarSegundosComoDuracao } from '../../utils/formatadores'

const INTERVALO_VERIFICACAO_MS = 1_000
const ANTECEDENCIA_AVISO_MS = 2 * 60_000
const MILISSEGUNDOS_POR_SEGUNDO = 1_000

@Component({
  selector: 'app-aviso-inatividade',
  templateUrl: './aviso-inatividade.html',
})
export class AvisoInatividade {
  private readonly sessaoService = inject(SessaoService)
  private readonly autenticacaoService = inject(AutenticacaoService)
  private readonly usuarioService = inject(UsuarioService)
  private readonly router = inject(Router)

  private readonly agora = signal(Date.now())
  protected readonly isRenovando = signal(false)
  protected readonly mensagemErro = signal<string | null>(null)

  private readonly tempoRestanteEmMs = computed(() => {
    const momentoExpiracao = this.sessaoService.momentoExpiracaoPorInatividade()
    return momentoExpiracao === null ? null : momentoExpiracao - this.agora()
  })

  protected readonly isAvisoVisivel = computed(() => {
    const tempoRestante = this.tempoRestanteEmMs()
    return tempoRestante !== null && tempoRestante <= ANTECEDENCIA_AVISO_MS
  })

  protected readonly tempoRestanteFormatado = computed(() =>
    formatarSegundosComoDuracao(
      Math.max(0, Math.ceil((this.tempoRestanteEmMs() ?? 0) / MILISSEGUNDOS_POR_SEGUNDO)),
    ),
  )

  constructor() {
    const identificadorIntervalo = setInterval(
      () => this.verificarInatividade(),
      INTERVALO_VERIFICACAO_MS,
    )
    inject(DestroyRef).onDestroy(() => clearInterval(identificadorIntervalo))
  }

  protected continuarConectada() {
    this.isRenovando.set(true)
    this.mensagemErro.set(null)

    this.usuarioService
      .buscarPerfil()
      .pipe(finalize(() => this.isRenovando.set(false)))
      .subscribe({
        error: (erro: unknown) => this.mensagemErro.set(interpretarErroApi(erro).mensagem),
      })
  }

  protected sairAgora() {
    this.autenticacaoService.sair().subscribe(() => this.router.navigateByUrl('/login'))
  }

  private verificarInatividade() {
    this.sessaoService.sincronizarUltimaAtividade()
    this.agora.set(Date.now())

    const tempoRestante = this.tempoRestanteEmMs()
    if (tempoRestante !== null && tempoRestante <= 0) this.encerrarPorInatividade()
  }

  private encerrarPorInatividade() {
    this.sessaoService.encerrarSessao('inatividade')
    this.router.navigateByUrl('/login')
  }
}
