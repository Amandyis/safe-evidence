import { Component, input, output, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  readonly isMenuLateralAberto = input(false)
  readonly aberturaMenuSolicitada = output<void>()

  protected readonly possuiNotificacoesNaoLidas = signal(true)

  protected solicitarAberturaMenu() {
    this.aberturaMenuSolicitada.emit()
  }

  protected abrirNotificacoes() {
    console.log('abrir notificações')
  }
}
