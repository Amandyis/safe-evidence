import { HttpRequest } from '@angular/common/http'
import { SessaoService } from '../app/services/sessao.service'
import { URL_BASE_API } from '../app/shared/constants/api.constants'

export const URL_EVIDENCIAS = `${URL_BASE_API}/evidencias`

export function isListagemDeEvidencias(requisicao: HttpRequest<unknown>): boolean {
  return requisicao.method === 'GET' && requisicao.url === URL_EVIDENCIAS
}

export class EventSourceFalso {
  static instancias: EventSourceFalso[] = []

  readonly url: string
  isFechado = false
  private readonly ouvintesPorEvento = new Map<string, ((evento: MessageEvent) => void)[]>()

  constructor(url: string | URL) {
    this.url = String(url)
    EventSourceFalso.instancias.push(this)
  }

  static instalar() {
    EventSourceFalso.instancias = []
    ;(globalThis as unknown as { EventSource: unknown }).EventSource = EventSourceFalso
  }

  static ultima(): EventSourceFalso {
    const instancia = EventSourceFalso.instancias.at(-1)
    if (!instancia) throw new Error('Nenhuma conexão SSE foi aberta.')
    return instancia
  }

  static abertas(): EventSourceFalso[] {
    return EventSourceFalso.instancias.filter((instancia) => !instancia.isFechado)
  }

  addEventListener(tipoEvento: string, ouvinte: (evento: MessageEvent) => void) {
    const ouvintes = this.ouvintesPorEvento.get(tipoEvento) ?? []
    this.ouvintesPorEvento.set(tipoEvento, [...ouvintes, ouvinte])
  }

  removeEventListener() {
    // não utilizado pela aplicação
  }

  close() {
    this.isFechado = true
  }

  emitir(tipoEvento: string, dados: unknown) {
    if (this.isFechado) return
    const evento = new MessageEvent(tipoEvento, { data: JSON.stringify(dados) })
    for (const ouvinte of this.ouvintesPorEvento.get(tipoEvento) ?? []) ouvinte(evento)
  }
}

export const USUARIA_TESTE = { id_vitima: 1, nome: 'Maria Souza', email: 'maria@teste.com' }

const MILISSEGUNDOS_POR_HORA = 3_600_000

export function iniciarSessaoDeTeste(sessaoService: SessaoService, horasDeValidade = 8) {
  sessaoService.iniciarSessao({
    token: 'token-de-teste',
    expira_em: new Date(Date.now() + horasDeValidade * MILISSEGUNDOS_POR_HORA).toISOString(),
    inatividade_minutos: 15,
    usuario: USUARIA_TESTE,
  })
}

export function textoDe(elemento: Element | null | undefined): string {
  return (elemento?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

export function botaoComTexto(raiz: ParentNode, texto: string): HTMLButtonElement {
  const botoes = Array.from(raiz.querySelectorAll<HTMLButtonElement>('button'))
  const botao = botoes.find((candidato) =>
    textoDe(candidato).toLowerCase().includes(texto.toLowerCase()),
  )
  if (!botao) throw new Error(`Botão "${texto}" não encontrado.`)
  return botao
}

export function garantirSuporteADialog() {
  const prototipo = HTMLDialogElement.prototype
  if (!Object.getOwnPropertyDescriptor(prototipo, 'open')) {
    Object.defineProperty(prototipo, 'open', {
      configurable: true,
      get(this: HTMLDialogElement) {
        return this.hasAttribute('open')
      },
    })
  }
  prototipo.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  prototipo.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
}
