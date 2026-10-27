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

describe('Tela de detalhe com o formato real da resposta do back', () => {
  let harness: RouterTestingHarness
  let httpMock: HttpTestingController

  function detalheRealApi(processoJudicial: string | null): EvidenciaDetalhadaApi {
    return {
      id_gravacao: ID_EVIDENCIA,
      gravada_em: '2026-10-26T19:40:09.474Z',
      dispositivo: 'esp32cam-01',
      duracao_segundos: 15.367,
      hash_sha256: 'b'.repeat(64),
      carimbo_tempo: {
        status: 'emitido',
        emitido_em: '2026-10-26T19:40:28.000Z',
        autoridade: 'https://freetsa.org/tsr',
        numero_serie: '0975f837',
      },
      processo_judicial: processoJudicial,
      status_analise: 'Concluido',
      tentativas_analise: 1,
      ultimo_erro_analise: null,
      laudo: {
        id_laudo: 'LAUDO-2026-000010',
        timestamp_emissao: '2026-10-26T19:40:31.574Z',
        dispositivo_origem: 'esp32cam-01',
        hash_video_original: 'b'.repeat(64),
        status_analise: 'CONCLUIDO',
        classificacao_final: 'NENHUM_EVENTO_DETECTADO',
        veredicto: 'Normal',
        indice_probabilidade: 6.34,
        segmentos_criticos: [],
        linha_do_tempo: [
          { inicio_s: 0, fim_s: 1, nivel: 'normal', score: 7.4, pico_s: 1, score_frame: 7.71 },
          { inicio_s: 1, fim_s: 2, nivel: 'normal', score: 7.08, pico_s: 1.74, score_frame: 8.57 },
        ],
        algoritmo_versao: 'yolov9c-cls-xdviolence-v1',
        duracao_video_segundos: 15.367,
        tempo_processamento_ms: 3560,
        dentro_do_prazo_rn16: true,
      },
    }
  }

  beforeEach(async () => {
    garantirSuporteADialog()
    EventSourceFalso.instalar()
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'evidencias/:idGravacao', component: DetalheEvidencia }]),
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

  async function abrir(processoJudicial: string | null) {
    const componente = await harness.navigateByUrl(`/evidencias/${ID_EVIDENCIA}`, DetalheEvidencia)
    httpMock
      .expectOne({ method: 'GET', url: URL_EVIDENCIA })
      .flush(detalheRealApi(processoJudicial))
    await harness.fixture.whenStable()
    httpMock
      .expectOne({ method: 'GET', url: `${URL_EVIDENCIA}/url` })
      .flush({ url: 'https://bucket.s3.amazonaws.com/video.mp4?X-Amz-Expires=900' })
    await harness.fixture.whenStable()
    return componente
  }

  it('usa o laudo para veredicto/score e mostra classificação, carimbo e laudo', async () => {
    const componente = await abrir(null)
    const evidencia = componente['evidenciaDetalhada']()?.evidencia

    expect(evidencia?.veredicto).toBe('Normal')
    expect(evidencia?.score).toBe(6.34)
    expect(evidencia?.isVinculadaAProcesso).toBe(false)
    expect(botaoComTexto(tela(), 'Deletar Vídeo').disabled).toBe(false)
    expect(botaoComTexto(tela(), 'Carimbo de Tempo (.tsr)').disabled).toBe(false)

    const texto = textoDe(tela())
    expect(texto).toContain('Nenhum evento detectado')
    expect(texto).toContain('LAUDO-2026-000010')
    expect(texto).toContain('Série 0975f837')
  })

  it('processo_judicial preenchido bloqueia a exclusão mesmo sem vinculada_a_processo', async () => {
    await abrir('Processo 0001234-56.2026.8.26.0100')

    expect(botaoComTexto(tela(), 'Deletar Vídeo').disabled).toBe(true)
    expect(textoDe(tela())).toContain(MENSAGEM_VINCULO_NA_TELA)
  })
})
