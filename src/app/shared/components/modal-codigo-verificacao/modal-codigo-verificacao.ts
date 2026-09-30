import {
  Component,
  ElementRef,
  afterRenderEffect,
  effect,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { InputOtpModule } from 'primeng/inputotp'
import { MensagemAlerta } from '../mensagem-alerta/mensagem-alerta'

const QUANTIDADE_DIGITOS_CODIGO = 6

let contadorInstancias = 0

@Component({
  selector: 'app-modal-codigo-verificacao',
  imports: [FormsModule, InputOtpModule, MensagemAlerta],
  templateUrl: './modal-codigo-verificacao.html',
  styleUrl: './modal-codigo-verificacao.scss',
})
export class ModalCodigoVerificacao {
  readonly isVisivel = model(false)
  readonly titulo = input('Confirme com o código enviado')
  readonly descricao = input('Digite o código de 6 dígitos que enviamos para o seu e-mail.')
  readonly textoBotaoConfirmar = input('Confirmar')
  readonly isProcessando = input(false)
  readonly mensagemErro = input<string | null>(null)

  readonly codigoConfirmado = output<string>()
  readonly reenvioSolicitado = output<void>()
  readonly cancelado = output<void>()

  private readonly elementoDialogo =
    viewChild.required<ElementRef<HTMLDialogElement>>('elementoDialogo')

  protected readonly quantidadeDigitosCodigo = QUANTIDADE_DIGITOS_CODIGO
  protected readonly idTitulo = `modal-codigo-verificacao-titulo-${contadorInstancias++}`
  protected readonly codigoDigitado = signal('')

  constructor() {
    effect(() => {
      if (this.isVisivel()) {
        untracked(() => this.codigoDigitado.set(''))
      }
    })

    afterRenderEffect(() => {
      const dialogo = this.elementoDialogo().nativeElement
      if (this.isVisivel() && !dialogo.open) {
        dialogo.showModal()
      } else if (!this.isVisivel() && dialogo.open) {
        dialogo.close()
      }
    })
  }

  protected isCodigoCompleto(): boolean {
    return this.codigoDigitado().length === QUANTIDADE_DIGITOS_CODIGO
  }

  protected confirmar() {
    if (!this.isCodigoCompleto() || this.isProcessando()) return
    this.codigoConfirmado.emit(this.codigoDigitado())
  }

  protected solicitarReenvio() {
    this.codigoDigitado.set('')
    this.reenvioSolicitado.emit()
  }

  protected cancelar() {
    this.isVisivel.set(false)
    this.cancelado.emit()
  }

  protected aoPressionarEsc(eventoCancelamento: Event) {
    eventoCancelamento.preventDefault()
    if (!this.isProcessando()) this.cancelar()
  }

  protected aoClicarNoDialogo(eventoClique: MouseEvent) {
    const isCliqueNoFundo = eventoClique.target === this.elementoDialogo().nativeElement
    if (isCliqueNoFundo && !this.isProcessando()) this.cancelar()
  }
}
