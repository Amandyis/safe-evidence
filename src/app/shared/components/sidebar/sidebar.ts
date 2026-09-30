import { Component, computed, inject, input, output, signal } from '@angular/core'
import { Router, RouterLink, RouterLinkActive } from '@angular/router'
import { AutenticacaoService } from '../../../services/autenticacao.service'
import { SessaoService } from '../../../services/sessao.service'

interface ItemNavegacao {
  rotulo: string
  classeIcone: string
  rota: string
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  host: {
    '(document:keydown.escape)': 'solicitarFechamento()',
  },
})
export class Sidebar {
  private readonly sessaoService = inject(SessaoService)
  private readonly autenticacaoService = inject(AutenticacaoService)
  private readonly router = inject(Router)

  readonly isMenuAberto = input(false)
  readonly fechamentoSolicitado = output<void>()

  protected readonly itensNavegacao: ItemNavegacao[] = [
    { rotulo: 'Dashboard', classeIcone: 'pi pi-th-large', rota: '/inicio' },
    { rotulo: 'Meu Perfil', classeIcone: 'pi pi-user', rota: '/perfil' },
    { rotulo: 'Manual de Uso', classeIcone: 'pi pi-book', rota: '/manual' },
  ]

  protected readonly isSaindo = signal(false)

  protected readonly nomeUsuario = this.sessaoService.nomeUsuarioLogado

  protected readonly emailUsuario = computed(() => this.sessaoService.usuarioLogado()?.email ?? '')

  protected readonly iniciaisUsuario = computed(() => {
    const partesNome = this.nomeUsuario()
      .split(' ')
      .filter((parteNome) => parteNome.length > 0)
    const primeiroNome = partesNome[0] ?? ''
    const ultimoNome = partesNome.length > 1 ? partesNome[partesNome.length - 1] : ''
    return `${primeiroNome.charAt(0)}${ultimoNome.charAt(0)}`.toUpperCase()
  })

  protected sair() {
    this.isSaindo.set(true)
    this.autenticacaoService.sair().subscribe(() => this.router.navigateByUrl('/login'))
  }

  protected solicitarFechamento() {
    if (this.isMenuAberto()) {
      this.fechamentoSolicitado.emit()
    }
  }
}
