import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { Router, provideRouter } from '@angular/router'
import { providePrimeNG } from 'primeng/config'
import type { MockInstance } from 'vitest'
import { autenticacaoInterceptor } from '../../interceptors/autenticacao.interceptor'
import { SessaoService } from '../../services/sessao.service'
import { URL_BASE_API } from '../../shared/constants/api.constants'
import { PerfilUsuarioApi } from '../../shared/models/perfil-usuario.model'
import { botaoComTexto, iniciarSessaoDeTeste, textoDe } from '../../../testing/apoio-testes'
import { Perfil } from '../perfil/perfil'
import { Cadastro } from './cadastro'

const URL_CADASTRO = `${URL_BASE_API}/auth/cadastro`

const DADOS_CONTA = {
  nome: 'Maria Souza',
  email: 'maria@teste.com',
  cpf: '52998224725',
  telefone: '11987654321',
  nascimento: new Date(1990, 4, 12),
  senha: 'Teste@1234',
  confirmarSenha: 'Teste@1234',
}
const DADOS_ENDERECO = {
  cep: '01310100',
  logradouro: 'Avenida Paulista',
  numero: '1000',
  complemento: 'Apto 12',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  uf: 'SP',
  referencia: '',
}

describe('CT10 – Cadastro de perfil (tela)', () => {
  let fixture: ComponentFixture<Cadastro>
  let elemento: HTMLElement
  let httpMock: HttpTestingController
  let navegacao: MockInstance<Router['navigateByUrl']>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [Cadastro],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([autenticacaoInterceptor])),
        provideHttpClientTesting(),
        providePrimeNG(),
      ],
    })
    httpMock = TestBed.inject(HttpTestingController)
    navegacao = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true)
    fixture = TestBed.createComponent(Cadastro)
    elemento = fixture.nativeElement as HTMLElement
    await fixture.whenStable()
  })

  afterEach(() => httpMock.verify())

  const formulario = () => fixture.componentInstance['form']
  const etapaAtual = () => fixture.componentInstance['etapa']()
  const textoDaTela = () => textoDe(elemento)

  async function clicar(textoBotao: string) {
    botaoComTexto(elemento, textoBotao).click()
    await fixture.whenStable()
  }

  async function preencherAteOsTermos() {
    formulario().controls.conta.setValue(DADOS_CONTA)
    await clicar('Próximo passo')
    expect(etapaAtual()).toBe(2)
    formulario().controls.endereco.setValue(DADOS_ENDERECO)
    await clicar('Próximo passo')
    expect(etapaAtual()).toBe(3)
  }

  it('cadastro completo com aceite dos termos envia os dados e o endereço de entrega ao backend', async () => {
    await preencherAteOsTermos()
    formulario().controls.termos.controls.aceite.setValue(true)
    await clicar('Concluir Cadastro')

    const requisicao = httpMock.expectOne({ method: 'POST', url: URL_CADASTRO })
    expect(requisicao.request.body).toEqual({
      nome: 'Maria Souza',
      cpf: '52998224725',
      email: 'maria@teste.com',
      telefone: '11987654321',
      senha: 'Teste@1234',
      endereco: DADOS_ENDERECO,
      consentimento: true,
    })
    requisicao.flush(
      { id_vitima: 1, mensagem: 'Cadastro realizado. Enviamos um e-mail de confirmação.' },
      { status: 201, statusText: 'Created' },
    )
    await fixture.whenStable()

    expect(navegacao).toHaveBeenCalledWith('/login')
    expect(TestBed.inject(SessaoService).consumirAvisoParaTelaLogin()).toContain(
      'Enviamos um e-mail de confirmação',
    )
  })

  it('CPF inválido (000.000.000-00) é recusado na tela, sem nenhuma requisição ao backend', async () => {
    formulario().controls.conta.setValue({ ...DADOS_CONTA, cpf: '00000000000' })
    await clicar('Próximo passo')

    expect(etapaAtual()).toBe(1)
    expect(textoDaTela()).toContain('CPF inválido.')
    httpMock.expectNone(URL_CADASTRO)
  })

  it('e-mail já cadastrado (HTTP 409) volta à etapa 1 com mensagem própria, diferente da de CPF', async () => {
    await preencherAteOsTermos()
    formulario().controls.termos.controls.aceite.setValue(true)
    await clicar('Concluir Cadastro')

    httpMock.expectOne(URL_CADASTRO).flush(
      {
        erro: 'Já existe uma conta com esses dados.',
        campos: { email: 'E-mail já cadastrado.' },
      },
      { status: 409, statusText: 'Conflict' },
    )
    await fixture.whenStable()

    expect(etapaAtual()).toBe(1)
    expect(textoDaTela()).toContain('E-mail já cadastrado.')
    expect(textoDaTela()).not.toContain('CPF inválido.')
    const alertaDeErro = textoDe(elemento.querySelector('app-mensagem-alerta'))
    expect(alertaDeErro).toContain('Já existe uma conta com esses dados.')
    expect(alertaDeErro).toContain('E-mail já cadastrado.')
    expect(navegacao).not.toHaveBeenCalled()
  })

  it('senha fraca não avança da etapa 1 (RN03)', async () => {
    formulario().controls.conta.setValue({
      ...DADOS_CONTA,
      senha: 'teste1234',
      confirmarSenha: 'teste1234',
    })
    await clicar('Próximo passo')

    expect(etapaAtual()).toBe(1)
    expect(formulario().controls.conta.controls.senha.hasError('senhaFraca')).toBe(true)
    httpMock.expectNone(URL_CADASTRO)
  })

  it('sem o aceite dos termos o cadastro não é enviado', async () => {
    await preencherAteOsTermos()
    await clicar('Concluir Cadastro')

    expect(textoDaTela()).toContain('É necessário aceitar os termos')
    httpMock.expectNone(URL_CADASTRO)
  })
})

describe('CT10 – Endereço de entrega visível na tela de perfil (RE05)', () => {
  it('o endereço cadastrado aparece no perfil da usuária', async () => {
    TestBed.configureTestingModule({
      imports: [Perfil],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([autenticacaoInterceptor])),
        provideHttpClientTesting(),
        providePrimeNG(),
      ],
    })
    iniciarSessaoDeTeste(TestBed.inject(SessaoService))
    const httpMock = TestBed.inject(HttpTestingController)
    const fixture = TestBed.createComponent(Perfil)

    const perfilApi: PerfilUsuarioApi = {
      id_vitima: 1,
      nome: 'Maria Souza',
      cpf_mascarado: '***.982.247-**',
      email: 'maria@teste.com',
      telefone: '11987654321',
      endereco: {
        cep: '01310100',
        logradouro: 'Avenida Paulista',
        numero: '1000',
        complemento: 'Apto 12',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP',
      },
      consentimento_em: '2026-10-07T10:00:00.000Z',
      criada_em: '2026-10-07T10:00:00.000Z',
      dispositivo: null,
    }
    httpMock.expectOne({ method: 'GET', url: `${URL_BASE_API}/perfil` }).flush(perfilApi)
    await fixture.whenStable()

    const texto = textoDe(fixture.nativeElement as HTMLElement)
    const trechosEsperados = ['Avenida Paulista', '1000', 'Apto 12', 'Bela Vista', '01310-100']
    for (const trecho of [...trechosEsperados, 'São Paulo']) {
      expect(texto).toContain(trecho)
    }
    httpMock.verify()
    localStorage.clear()
  })
})
