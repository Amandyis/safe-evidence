import { TestBed } from '@angular/core/testing'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { Router, provideRouter } from '@angular/router'
import { RouterTestingHarness } from '@angular/router/testing'
import { providePrimeNG } from 'primeng/config'
import { routes } from '../app.routes'
import { autenticacaoInterceptor } from '../interceptors/autenticacao.interceptor'
import { SessaoService } from '../services/sessao.service'
import { URL_BASE_API } from '../shared/constants/api.constants'
import {
  EventSourceFalso,
  URL_EVIDENCIAS,
  isListagemDeEvidencias,
  USUARIA_TESTE,
  iniciarSessaoDeTeste,
  textoDe,
} from '../../testing/apoio-testes'

const SELETORES_DASHBOARD = ['app-layout-principal', 'app-inicio', 'app-tabela-evidencias']
const OITO_HORAS = 8 * 3_600_000

describe('CT09 – AuthGuard em rotas protegidas', () => {
  let harness: RouterTestingHarness
  let httpMock: HttpTestingController
  let sessaoService: SessaoService
  let observadorDom: MutationObserver
  let elementosDoDashboardInseridos: string[]

  beforeEach(async () => {
    localStorage.clear()
    EventSourceFalso.instalar()
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([autenticacaoInterceptor])),
        provideHttpClientTesting(),
        providePrimeNG(),
      ],
    })
    httpMock = TestBed.inject(HttpTestingController)
    sessaoService = TestBed.inject(SessaoService)
    harness = await RouterTestingHarness.create()

    elementosDoDashboardInseridos = []
    observadorDom = new MutationObserver((mutacoes) => registrarInsercoes(mutacoes))
    observadorDom.observe(document.body, { childList: true, subtree: true })
  })

  afterEach(() => {
    observadorDom.disconnect()
    httpMock.verify()
    vi.useRealTimers()
    localStorage.clear()
  })

  function registrarInsercoes(mutacoes: MutationRecord[]) {
    for (const mutacao of mutacoes) {
      for (const no of Array.from(mutacao.addedNodes)) {
        if (!(no instanceof Element)) continue
        for (const seletor of SELETORES_DASHBOARD) {
          if (no.matches(seletor) || no.querySelector(seletor)) {
            elementosDoDashboardInseridos.push(seletor)
          }
        }
      }
    }
  }

  function dashboardFoiRenderizado(): boolean {
    registrarInsercoes(observadorDom.takeRecords())
    return elementosDoDashboardInseridos.length > 0
  }

  const urlAtual = () => TestBed.inject(Router).url
  const telaAtual = () => harness.routeNativeElement as HTMLElement

  async function abrirDashboardAutenticada() {
    iniciarSessaoDeTeste(sessaoService)
    await harness.navigateByUrl('/inicio')
    httpMock.expectOne(isListagemDeEvidencias).flush([])
    await harness.fixture.whenStable()
  }

  function semRequisicoesDeDados() {
    httpMock.expectNone((requisicao) => requisicao.url.startsWith(URL_EVIDENCIAS))
    expect(EventSourceFalso.instancias.filter((sse) => !sse.isFechado)).toHaveLength(0)
  }

  function semDadosDaUsuariaNaTela() {
    const textoDaPagina = textoDe(document.body)
    expect(textoDaPagina).not.toContain(USUARIA_TESTE.nome)
    expect(textoDaPagina).not.toContain('Galeria de Evidências')
    for (const seletor of SELETORES_DASHBOARD) {
      expect(document.body.querySelector(seletor)).toBeNull()
    }
  }

  it('controle: com sessão válida o dashboard abre e busca as evidências', async () => {
    await abrirDashboardAutenticada()
    expect(urlAtual()).toBe('/inicio')
    expect(textoDe(document.body)).toContain('Galeria de Evidências')
    expect(textoDe(document.body)).toContain(USUARIA_TESTE.nome)
  })

  it('após logout pelo botão Sair, voltar ao /inicio pela barra de endereço leva ao login sem renderizar nada', async () => {
    await abrirDashboardAutenticada()

    document.body.querySelector<HTMLButtonElement>('button[aria-label="Sair da conta"]')?.click()
    httpMock.expectOne({ method: 'POST', url: `${URL_BASE_API}/auth/logout` }).flush(null)
    await harness.fixture.whenStable()
    expect(urlAtual()).toBe('/login')
    expect(sessaoService.token()).toBeNull()
    expect(localStorage.getItem('safe-evidence:token')).toBeNull()

    EventSourceFalso.instancias = []
    elementosDoDashboardInseridos = []
    await harness.navigateByUrl('/inicio')

    expect(urlAtual()).toBe('/login')
    expect(dashboardFoiRenderizado()).toBe(false)
    semRequisicoesDeDados()
    semDadosDaUsuariaNaTela()
    expect(telaAtual().querySelector('#email')).not.toBeNull()
  })

  it('após logout, rotas internas (/evidencias/:id, /perfil, /manual) também são bloqueadas', async () => {
    await abrirDashboardAutenticada()
    sessaoService.encerrarSessao('logout')
    EventSourceFalso.instancias = []
    elementosDoDashboardInseridos = []

    for (const rotaProtegida of ['/evidencias/42', '/perfil', '/manual']) {
      await harness.navigateByUrl(rotaProtegida)
      expect(urlAtual()).toBe('/login')
    }
    expect(dashboardFoiRenderizado()).toBe(false)
    semRequisicoesDeDados()
    httpMock.expectNone(`${URL_BASE_API}/perfil`)
  })

  it('expiração automática da sessão (8 h) sem logout: mesmo comportamento e aviso na tela de login', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-07T08:00:00Z'))
    iniciarSessaoDeTeste(sessaoService, 8)

    vi.setSystemTime(new Date(Date.now() + OITO_HORAS + 1_000))
    await harness.navigateByUrl('/inicio')

    expect(urlAtual()).toBe('/login')
    expect(dashboardFoiRenderizado()).toBe(false)
    semRequisicoesDeDados()
    semDadosDaUsuariaNaTela()
    expect(localStorage.getItem('safe-evidence:token')).toBeNull()
    expect(textoDe(telaAtual())).toContain('Sua sessão foi encerrada')
  })

  it('token recusado pelo backend (401) no meio do uso encerra a sessão e volta ao login', async () => {
    iniciarSessaoDeTeste(sessaoService)
    await harness.navigateByUrl('/inicio')
    httpMock
      .expectOne({ method: 'GET', url: URL_EVIDENCIAS })
      .flush(
        { erro: 'Sessão encerrada por inatividade.', codigo: 'SESSAO_INATIVA' },
        { status: 401, statusText: 'Unauthorized' },
      )
    await harness.fixture.whenStable()

    expect(urlAtual()).toBe('/login')
    expect(sessaoService.token()).toBeNull()
    expect(textoDe(document.body)).toContain('Sua sessão expirou por inatividade')
  })

  it('usuária já autenticada que abre /login é levada ao dashboard', async () => {
    await abrirDashboardAutenticada()
    await harness.navigateByUrl('/login')
    expect(urlAtual()).toBe('/inicio')
    httpMock.match(URL_EVIDENCIAS).forEach((requisicao) => requisicao.flush([]))
  })
})
