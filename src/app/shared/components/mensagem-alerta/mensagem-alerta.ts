import { Component, computed, input } from '@angular/core'

export type TipoMensagemAlerta = 'erro' | 'sucesso' | 'aviso'

interface AparenciaMensagemAlerta {
  classesCor: string
  classeIcone: string
  papelAcessibilidade: 'alert' | 'status'
}

const APARENCIA_POR_TIPO: Record<TipoMensagemAlerta, AparenciaMensagemAlerta> = {
  erro: {
    classesCor: 'border-red-200 bg-red-50 text-red-700',
    classeIcone: 'pi pi-times-circle',
    papelAcessibilidade: 'alert',
  },
  sucesso: {
    classesCor: 'border-green-200 bg-green-50 text-green-700',
    classeIcone: 'pi pi-check-circle',
    papelAcessibilidade: 'status',
  },
  aviso: {
    classesCor: 'border-amber-200 bg-amber-50 text-amber-800',
    classeIcone: 'pi pi-info-circle',
    papelAcessibilidade: 'status',
  },
}

@Component({
  selector: 'app-mensagem-alerta',
  template: `
    <div
      class="flex items-start gap-2 rounded-lg border p-3 text-sm"
      [class]="aparencia().classesCor"
      [attr.role]="aparencia().papelAcessibilidade"
    >
      <i class="mt-0.5" [class]="aparencia().classeIcone" aria-hidden="true"></i>
      <span class="min-w-0 break-words"><ng-content /></span>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class MensagemAlerta {
  readonly tipo = input<TipoMensagemAlerta>('erro')

  protected readonly aparencia = computed(() => APARENCIA_POR_TIPO[this.tipo()])
}
