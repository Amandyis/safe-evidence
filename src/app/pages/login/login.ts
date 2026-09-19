import { Component, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CardModule } from 'primeng/card'
import { IconFieldModule } from 'primeng/iconfield'
import { InputOtpModule } from 'primeng/inputotp'
import { SignIn } from '@primeicons/angular/sign-in'
@Component({
  selector: 'app-login',
  imports: [CardModule, IconFieldModule, InputOtpModule, FormsModule, SignIn],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  protected readonly showPassword = signal(false)
  isAutenticacaoVisisvel = signal(false)
  protected readonly codigo = signal('')
  protected readonly isTelaRecuperacao = signal(false)
  protected readonly emailRecuperacao = signal('')
  protected readonly emailEnviado = signal(false)

  protected togglePassword() {
    this.showPassword.update((value) => !value)
  }

  onEntrar() {
    this.isAutenticacaoVisisvel.update((value) => !value)
  }

  protected onEsqueciSenha() {
    this.isTelaRecuperacao.set(true)
    this.emailEnviado.set(false)
  }

  protected voltarParaLogin() {
    this.isTelaRecuperacao.set(false)
    this.emailEnviado.set(false)
  }

  protected recuperarSenha() {
    this.emailEnviado.set(true)
    console.log('e-mail de recuperação enviado para:', this.emailRecuperacao())
  }

  protected enviarCodigo() {
    console.log('código enviado:', this.codigo())
  }

  protected reenviarCodigo() {
    this.codigo.set('')
    console.log('código reenviado')
  }
}
