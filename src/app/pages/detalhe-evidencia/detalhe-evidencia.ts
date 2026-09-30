import { Component, computed, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { map } from 'rxjs'
import { EvidenciaService } from '../../services/evidencia.service'
import { LinhaTempoAgressividade } from '../../shared/components/linha-tempo-agressividade/linha-tempo-agressividade'
import { ModalConfirmacao } from '../../shared/components/modal-confirmacao/modal-confirmacao'
import { PainelAnaliseIa } from '../../shared/components/painel-analise-ia/painel-analise-ia'
import { TabelaMetadadosArquivo } from '../../shared/components/tabela-metadados-arquivo/tabela-metadados-arquivo'
import { APARENCIA_POR_STATUS } from '../../shared/models/evidencia.model'

@Component({
  selector: 'app-detalhe-evidencia',
  imports: [
    RouterLink,
    LinhaTempoAgressividade,
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

  private readonly codigoEvidencia = toSignal(
    this.rotaAtiva.paramMap.pipe(map((parametrosRota) => parametrosRota.get('codigo') ?? '')),
    { initialValue: '' },
  )

  protected readonly evidenciaDetalhada = computed(() =>
    this.evidenciaService.buscarEvidenciaDetalhada(this.codigoEvidencia()),
  )

  protected readonly aparenciaStatus = computed(() => {
    const detalhes = this.evidenciaDetalhada()
    return detalhes ? APARENCIA_POR_STATUS[detalhes.evidencia.statusProcessamento] : null
  })

  protected readonly isModalExclusaoVisivel = signal(false)

  protected baixarVideoSeguranca() {
    console.log('download de segurança da evidência:', this.codigoEvidencia())
  }

  protected baixarRelatorioIa() {
    console.log('baixar relatório da IA da evidência:', this.codigoEvidencia())
  }

  protected solicitarExclusaoVideo() {
    this.isModalExclusaoVisivel.set(true)
  }

  protected excluirVideo() {
    this.evidenciaService.excluirEvidencia(this.codigoEvidencia())
    this.router.navigateByUrl('/inicio')
  }
}
