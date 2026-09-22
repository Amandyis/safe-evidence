import { Component, inject, model, signal } from '@angular/core'
import { CardModule } from 'primeng/card'
import { ButtonModule } from 'primeng/button'
import { IconFieldModule } from 'primeng/iconfield'
import { InputMaskModule } from 'primeng/inputmask'
import { DatePickerModule } from 'primeng/datepicker'
import { TabsModule } from 'primeng/tabs'
import { Router } from '@angular/router'

@Component({
  selector: 'app-cadastro',
  imports: [
    CardModule,
    ButtonModule,
    IconFieldModule,
    InputMaskModule,
    DatePickerModule,
    TabsModule,
  ],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.scss',
})
export class Cadastro {
  protected readonly showSenha = signal(false)
  protected readonly showConfirmarSenha = signal(false)
  protected readonly tabAtiva = model<'cadastro' | 'endereco' | 'confirmacao'>('cadastro')

  private route = inject(Router)

  protected toggleSenha() {
    this.showSenha.update((value) => !value)
  }

  protected toggleConfirmarSenha() {
    this.showConfirmarSenha.update((value) => !value)
  }

  protected onProximoPasso() {
    this.tabAtiva.set('endereco')
  }

  protected onJaTenhoConta() {
    this.route.navigateByUrl('/login')
  }
}
