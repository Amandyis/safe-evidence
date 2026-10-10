import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { Router, provideRouter } from '@angular/router'
import { RouterTestingHarness } from '@angular/router/testing'
import { providePrimeNG } from 'primeng/config'
import { autenticacaoInterceptor } from '../../interceptors/autenticacao.interceptor'
import { SessaoService } from '../../services/sessao.service'
import { EvidenciaDetalhadaApi } from '../../shared/models/evidencia-detalhada.model'
import {
  EventSourceFalso,
  URL_EVIDENCIAS,
  botaoComTexto,
  garantirSuporteADialog,
  iniciarSessaoDeTeste,
  textoDe,
} from '../../../testing/apoio-testes'
import { DetalheEvidencia } from './detalhe-evidencia'

@Component({ template: '<p>Galeria</p>' })
class GaleriaFalsa {}

const ID_EVIDENCIA = 42
const URL_EVIDENCIA = `${URL_EVIDENCIAS}/${ID_EVIDENCIA}`
const MENSAGEM_VINCULO_NA_TELA =
  'Evidências vinculadas a processo judicial não podem ser excluídas.'
const RESPOSTA_VINCULO_JUDICIAL = {
  erro: 'Esta evidência está vinculada a um processo judicial ativo e não pode ser excluída.',
  codigo: 'VINCULO_JUDICIAL',
}

function detalheApi(isVinculadaAProcesso: boolean): EvidenciaDetalhadaApi {
  return {
    id_gravacao: ID_EVIDENCIA,
    gravada_em: '2026-10-07T14:30:00.000Z',
    dispositivo: 'ESP32-CAM-01',
    duracao_segundos: 30,
    status_analise: 'Concluido',
    veredicto: 'Normal',
    score: 0.12,
    vinculada_a_processo: isVinculadaAProcesso,
    hash_sha256: 'a'.repeat(64),
    processo_judicial: isVinculadaAProcesso ? 'Processo 0001234-56.2026.8.26.0100' : null,
    tentativas_analise: 1,
    ultimo_erro_analise: null,
    laudo: null,
  }
}

describe('CT11 – Restrição de exclusão com processo judicial ativo (tela de detalhe)', () => {
  let harness: RouterTestingHarness
  let httpMock: HttpTestingController

  beforeEach(async () => {
    garantirSuporteADialog()
    EventSourceFalso.instalar()
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'evidencias/:idGravacao', component: DetalheEvidencia },
          { path: 'inicio', component: GaleriaFalsa },
        ]),
        provideHttpClient(withInterceptors([autenticacaoInterceptor])),
        provideHttpClientTesting(),
        providePrimeNG(),
      ],
    })
    iniciarSessaoDeTeste(TestBed.inject(SessaoService))
    httpMock = TestBed.inject(HttpTestingController)
    harness = await RouterTestingHarness.create()
  })

  afterEach(() => {
    httpMock.verify()
    localStorage.clear()
  })

  const tela = () => harness.routeNativeElement as HTMLElement
  const botaoDeletar = () => botaoComTexto(tela(), 'Deletar Vídeo')
  const modalExclusao = () => tela().querySelector('dialog')
  const urlAtual = () => TestBed.inject(Router).url

  async function abrirEvidencia(isVinculadaAProcesso: boolean) {
    const componente = await harness.navigateByUrl(`/evidencias/${ID_EVIDENCIA}`, DetalheEvidencia)
    await responderDetalhe(isVinculadaAProcesso)
    httpMock
      .expectOne({ method: 'GET', url: `${URL_EVIDENCIA}/url` })
      .flush({ url: 'https://bucket.s3.amazonaws.com/video.mp4?X-Amz-Expires=900' })
    await harness.fixture.whenStable()
    return componente
  }

  async function responderDetalhe(isVinculadaAProcesso: boolean) {
    httpMock
      .expectOne({ method: 'GET', url: URL_EVIDENCIA })
      .flush(detalheApi(isVinculadaAProcesso))
    await harness.fixture.whenStable()
  }

  it('evidência vinculada: botão de exclusão desabilitado, com mensagem explicativa, e o fluxo não inicia', async () => {
    await abrirEvidencia(true)

    expect(botaoDeletar().disabled).toBe(true)
    expect(textoDe(tela())).toContain(MENSAGEM_VINCULO_NA_TELA)

    botaoDeletar().click()
    await harness.fixture.whenStable()
    expect(modalExclusao()?.hasAttribute('open')).toBe(false)
    httpMock.expectNone({ method: 'DELETE', url: URL_EVIDENCIA })
  })

  it('segunda barreira: se a exclusão for forçada, o HTTP 409 (VINCULO_JUDICIAL) é exibido e a evidência permanece', async () => {
    const componente = await abrirEvidencia(true)

    componente['excluirVideo']()
    const exclusao = httpMock.expectOne({ method: 'DELETE', url: URL_EVIDENCIA })
    expect(exclusao.request.body).toEqual({ confirmacao: true })
    exclusao.flush(RESPOSTA_VINCULO_JUDICIAL, { status: 409, statusText: 'Conflict' })
    await harness.fixture.whenStable()

    expect(textoDe(tela())).toContain('vinculada a um processo judicial ativo')
    expect(urlAtual()).toBe(`/evidencias/${ID_EVIDENCIA}`)
    expect(textoDe(tela())).toContain(`Evidência EVID-2026-000${ID_EVIDENCIA}`)
  })

  it('evidência sem vínculo: exclusão só acontece após a dupla confirmação (botão + modal)', async () => {
    await abrirEvidencia(false)

    expect(botaoDeletar().disabled).toBe(false)
    expect(textoDe(tela())).not.toContain(MENSAGEM_VINCULO_NA_TELA)

    botaoDeletar().click()
    await harness.fixture.whenStable()
    expect(modalExclusao()?.hasAttribute('open')).toBe(true)
    expect(textoDe(modalExclusao())).toContain('Tem certeza que deseja deletar este vídeo?')
    httpMock.expectNone({ method: 'DELETE', url: URL_EVIDENCIA }) // 1ª confirmação não exclui

    botaoComTexto(modalExclusao() as HTMLElement, 'Sim, deletar vídeo').click()
    const exclusao = httpMock.expectOne({ method: 'DELETE', url: URL_EVIDENCIA })
    expect(exclusao.request.body).toEqual({ confirmacao: true })
    exclusao.flush(null, { status: 204, statusText: 'No Content' })
    await harness.fixture.whenStable()

    expect(urlAtual()).toBe('/inicio')
  })

  it('cancelar no modal não exclui a evidência', async () => {
    await abrirEvidencia(false)

    botaoDeletar().click()
    await harness.fixture.whenStable()
    botaoComTexto(modalExclusao() as HTMLElement, 'Cancelar').click()
    await harness.fixture.whenStable()

    expect(modalExclusao()?.hasAttribute('open')).toBe(false)
    httpMock.expectNone({ method: 'DELETE', url: URL_EVIDENCIA })
    expect(urlAtual()).toBe(`/evidencias/${ID_EVIDENCIA}`)
  })

  it('após a remoção do vínculo judicial, ao recarregar a evidência o botão volta a ser habilitado', async () => {
    const componente = await abrirEvidencia(true)
    expect(botaoDeletar().disabled).toBe(true)

    componente['carregarDetalhes']()
    await responderDetalhe(false)

    expect(botaoDeletar().disabled).toBe(false)
    expect(textoDe(tela())).not.toContain(MENSAGEM_VINCULO_NA_TELA)
  })
})
