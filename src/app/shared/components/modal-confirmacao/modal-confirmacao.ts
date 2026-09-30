import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  input,
  model,
  output,
  viewChild,
} from '@angular/core'

export type VarianteModalConfirmacao = 'padrao' | 'perigo'

interface ClassesVariante {
  fundoIcone: string
  botaoConfirmar: string
}

const CLASSES_POR_VARIANTE: Record<VarianteModalConfirmacao, ClassesVariante> = {
  padrao: {
    fundoIcone: 'bg-blue-50 text-blue-900',
    botaoConfirmar: 'bg-blue-900 hover:bg-blue-950 text-white',
  },
  perigo: {
    fundoIcone: 'bg-red-50 text-red-600',
    botaoConfirmar: 'bg-red-600 hover:bg-red-700 text-white',
  },
}

let contadorInstancias = 0

@Component({
  selector: 'app-modal-confirmacao',
  templateUrl: './modal-confirmacao.html',
  styleUrl: './modal-confirmacao.scss',
})
export class ModalConfirmacao {
  readonly isVisivel = model(false)
  readonly pergunta = input.required<string>()
  readonly classeIcone = input.required<string>()
  readonly descricao = input('')
  readonly textoBotaoConfirmar = input('Confirmar')
  readonly textoBotaoCancelar = input('Cancelar')
  readonly variante = input<VarianteModalConfirmacao>('padrao')

  readonly confirmado = output<void>()
  readonly cancelado = output<void>()

  private readonly elementoDialogo =
    viewChild.required<ElementRef<HTMLDialogElement>>('elementoDialogo')

  protected readonly idPergunta = `modal-confirmacao-pergunta-${contadorInstancias++}`
  protected readonly classesVariante = computed(() => CLASSES_POR_VARIANTE[this.variante()])

  constructor() {
    afterRenderEffect(() => {
      const dialogo = this.elementoDialogo().nativeElement
      if (this.isVisivel() && !dialogo.open) {
        dialogo.showModal()
      } else if (!this.isVisivel() && dialogo.open) {
        dialogo.close()
      }
    })
  }

  protected confirmar() {
    this.isVisivel.set(false)
    this.confirmado.emit()
  }

  protected cancelar() {
    this.isVisivel.set(false)
    this.cancelado.emit()
  }

  protected aoPressionarEsc(eventoCancelamento: Event) {
    eventoCancelamento.preventDefault()
    this.cancelar()
  }

  protected aoClicarNoDialogo(eventoClique: MouseEvent) {
    if (eventoClique.target === this.elementoDialogo().nativeElement) {
      this.cancelar()
    }
  }
}
