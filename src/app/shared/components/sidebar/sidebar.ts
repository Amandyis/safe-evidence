import { Component, computed, inject, input, output } from '@angular/core'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { UsuarioService } from '../../../services/usuario.service'

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
  private readonly usuarioService = inject(UsuarioService)

  readonly isMenuAberto = input(false)
  readonly fechamentoSolicitado = output<void>()

  protected readonly itensNavegacao: ItemNavegacao[] = [
    { rotulo: 'Dashboard', classeIcone: 'pi pi-th-large', rota: '/inicio' },
    { rotulo: 'Meu Perfil', classeIcone: 'pi pi-user', rota: '/perfil' },
  ]

  protected readonly nomeUsuario = computed(
    () => this.usuarioService.perfilUsuario().informacoesPessoais.nomeCompleto,
  )

  protected readonly cargoUsuario = computed(() => this.usuarioService.perfilUsuario().cargo)

  protected readonly iniciaisUsuario = computed(() => {
    const partesNome = this.nomeUsuario()
      .split(' ')
      .filter((parteNome) => parteNome.length > 0)
    const primeiroNome = partesNome[0] ?? ''
    const ultimoNome = partesNome.length > 1 ? partesNome[partesNome.length - 1] : ''
    return `${primeiroNome.charAt(0)}${ultimoNome.charAt(0)}`.toUpperCase()
  })

  protected solicitarFechamento() {
    if (this.isMenuAberto()) {
      this.fechamentoSolicitado.emit()
    }
  }
}
