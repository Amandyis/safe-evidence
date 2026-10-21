import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { Router, provideRouter } from '@angular/router'
import { providePrimeNG } from 'primeng/config'
import { autenticacaoInterceptor } from '../../../interceptors/autenticacao.interceptor'
import { SessaoService } from '../../../services/sessao.service'
import { EvidenciaApi, EventoStatusAnaliseApi } from '../../models/evidencia.model'
import {
  EventSourceFalso,
  URL_EVIDENCIAS,
  isListagemDeEvidencias,
  iniciarSessaoDeTeste,
  textoDe,
} from '../../../../testing/apoio-testes'
import { TabelaEvidencias } from './tabela-evidencias'

const ID_EVIDENCIA_PENDENTE = 7
const LIMITE_ATUALIZACAO_MS = 5_000

function evidenciaApi(idGravacao: number, sobrescritas: Partial<EvidenciaApi> = {}): EvidenciaApi {
  return {
    id_gravacao: idGravacao,
    gravada_em: '2026-10-07T14:30:00.000Z',
    dispositivo: 'ESP32-CAM-01',
    duracao_segundos: 30,
    status_analise: 'Pendente',
    veredicto: null,
    score: null,
    vinculada_a_processo: false,
    ...sobrescritas,
  }
}

const EVENTO_PROCESSANDO: EventoStatusAnaliseApi = {
  id_gravacao: ID_EVIDENCIA_PENDENTE,
  status_analise: 'Processando',
  veredicto: null,
  score: null,
}
const EVENTO_CONCLUIDO: EventoStatusAnaliseApi = {
  id_gravacao: ID_EVIDENCIA_PENDENTE,
  status_analise: 'Concluido',
  veredicto: 'Alerta Alto',
  score: 0.91,
}

describe('CT08 – Atualização reativa de status via SSE (galeria de evidências)', () => {
  let fixture: ComponentFixture<TabelaEvidencias>
  let elemento: HTMLElement
  let httpMock: HttpTestingController

  function configurar() {
    EventSourceFalso.instalar()
    TestBed.configureTestingModule({
      imports: [TabelaEvidencias],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([autenticacaoInterceptor])),
        provideHttpClientTesting(),
        providePrimeNG(),
      ],
    })
    iniciarSessaoDeTeste(TestBed.inject(SessaoService))
    httpMock = TestBed.inject(HttpTestingController)
    fixture = TestBed.createComponent(TabelaEvidencias)
    elemento = fixture.nativeElement as HTMLElement
  }

  function responderListagem() {
    const listagem = httpMock.expectOne(isListagemDeEvidencias)
    expect(listagem.request.headers.get('Authorization')).toBe('Bearer token-de-teste')
    listagem.flush([
      evidenciaApi(ID_EVIDENCIA_PENDENTE),
      evidenciaApi(8, { status_analise: 'Concluido', veredicto: 'Normal', score: 0.1 }),
    ])
  }

  const cartaoDaEvidencia = (idGravacao: number) =>
    Array.from(elemento.querySelectorAll('li')).find((cartao) =>
      textoDe(cartao).includes(`${idGravacao}`.padStart(5, '0')),
    ) ?? null

  afterEach(() => {
    httpMock.verify()
    localStorage.clear()
  })

  describe('com relógio real', () => {
    beforeEach(async () => {
      configurar()
      responderListagem()
      await fixture.whenStable()
    })

    it('abre uma única conexão SSE autenticada para /evidencias/eventos', () => {
      expect(EventSourceFalso.abertas()).toHaveLength(1)
      expect(EventSourceFalso.ultima().url).toBe(`${URL_EVIDENCIAS}/eventos?token=token-de-teste`)
    })

    it('o selo muda de Pendente → Em análise → Analisado sem recarregar a página, em menos de 5 s', async () => {
      expect(textoDe(cartaoDaEvidencia(ID_EVIDENCIA_PENDENTE))).toContain('Pendente')

      EventSourceFalso.ultima().emitir('status_analise', EVENTO_PROCESSANDO)
      await fixture.whenStable()
      expect(textoDe(cartaoDaEvidencia(ID_EVIDENCIA_PENDENTE))).toContain('Em análise')

      const inicio = performance.now()
      EventSourceFalso.ultima().emitir('status_analise', EVENTO_CONCLUIDO)
      await fixture.whenStable()
      const tempoAtualizacaoMs = performance.now() - inicio

      const textoCartao = textoDe(cartaoDaEvidencia(ID_EVIDENCIA_PENDENTE))
      expect(textoCartao).toContain('Analisado')
      expect(textoCartao).toContain('Alerta alto')
      expect(textoCartao).not.toContain('Pendente')
      expect(tempoAtualizacaoMs).toBeLessThan(LIMITE_ATUALIZACAO_MS)
      console.info(`[CT08] selo atualizado ${tempoAtualizacaoMs.toFixed(1)} ms após o evento SSE`)

      httpMock.expectNone(isListagemDeEvidencias)
    })

    it('atualiza também com a aba em segundo plano (document.visibilityState = hidden)', async () => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))

      EventSourceFalso.ultima().emitir('status_analise', EVENTO_CONCLUIDO)
      await fixture.whenStable()

      expect(textoDe(cartaoDaEvidencia(ID_EVIDENCIA_PENDENTE))).toContain('Analisado')
      expect(EventSourceFalso.abertas()).toHaveLength(1)
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    })

    it('eventos de outra evidência não alteram o cartão', async () => {
      EventSourceFalso.ultima().emitir('status_analise', { ...EVENTO_CONCLUIDO, id_gravacao: 999 })
      await fixture.whenStable()
      expect(textoDe(cartaoDaEvidencia(ID_EVIDENCIA_PENDENTE))).toContain('Pendente')
    })

    it('fecha a conexão SSE ao sair da tela (sem conexões órfãs)', () => {
      fixture.destroy()
      expect(EventSourceFalso.abertas()).toHaveLength(0)
    })

    it('evento sessao_encerrada fecha a conexão e leva ao login', async () => {
      const navegacao = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true)

      EventSourceFalso.ultima().emitir('sessao_encerrada', {})
      await fixture.whenStable()

      expect(EventSourceFalso.abertas()).toHaveLength(0)
      expect(navegacao).toHaveBeenCalledWith('/login')
      expect(TestBed.inject(SessaoService).token()).toBeNull()
    })
  })

  describe('com relógio simulado (10 min sem interação)', () => {
    afterEach(() => vi.useRealTimers())

    it('não faz polling: nenhuma requisição HTTP repetida enquanto aguarda o backend', () => {
      vi.useFakeTimers({
        toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
      })
      configurar()
      responderListagem()

      vi.advanceTimersByTime(10 * 60_000)

      expect(httpMock.match(() => true)).toHaveLength(0)
      expect(EventSourceFalso.abertas()).toHaveLength(1)
    })
  })
})
