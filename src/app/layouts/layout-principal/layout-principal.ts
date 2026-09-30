import { Component, signal } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { Header } from '../../shared/components/header/header'
import { Sidebar } from '../../shared/components/sidebar/sidebar'

@Component({
  selector: 'app-layout-principal',
  imports: [RouterOutlet, Header, Sidebar],
  templateUrl: './layout-principal.html',
  styleUrl: './layout-principal.scss',
})
export class LayoutPrincipal {
  protected readonly isMenuLateralAberto = signal(false)

  protected abrirMenuLateral() {
    this.isMenuLateralAberto.set(true)
  }

  protected fecharMenuLateral() {
    this.isMenuLateralAberto.set(false)
  }
}
