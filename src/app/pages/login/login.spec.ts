import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing'
import { provideRouter } from '@angular/router'
import { providePrimeNG } from 'primeng/config'
import { autenticacaoInterceptor } from '../../interceptors/autenticacao.interceptor'
import { URL_BASE_API } from '../../shared/constants/api.constants'
import { botaoComTexto, textoDe } from '../../../testing/apoio-testes'
import { Login } from './login'

const URL_LOGIN = `${URL_BASE_API}/auth/login`
const EMAIL_CONTA = 'maria@teste.com'
const SENHA_INCORRETA = 'Teste@1234X'

const RESPOSTA_SENHA_INCORRETA = {
  erro: 'E-mail ou senha incorretos.',
  codigo: 'CREDENCIAIS_INVALIDAS',
}
const RESPOSTA_BLOQUEIO_NA_3A_TENTATIVA = {
  erro: 'Muitas tentativas incorretas. Conta bloqueada por 30 min.',
  codigo: 'BLOQUEIO_TEMPORARIO',
  minutos_restantes: 30,
}
const RESPOSTA_BLOQUEIO_AOS_29_MIN = {
  erro: 'Conta bloqueada temporariamente. Tente de novo em 1 min.',
  codigo: 'BLOQUEIO_TEMPORARIO',
  minutos_restantes: 1,
}
const RESPOSTA_BLOQUEIO_PERMANENTE = {
  erro: 'Conta bloqueada por excesso de tentativas. Entre em contato com o suporte.',
  codigo: 'BLOQUEIO_PERMANENTE',
}

describe('CT07 – Bloqueio de login por força bruta (tela de login)', () => {
  let fixture: ComponentFixture<Login>
  let elemento: HTMLElement
  let httpMock: HttpTestingController

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([autenticacaoInterceptor])),
        provideHttpClientTesting(),
        providePrimeNG(),
      ],
    })
    httpMock = TestBed.inject(HttpTestingController)
    fixture = TestBed.createComponent(Login)
    elemento = fixture.nativeElement as HTMLElement
    await fixture.whenStable()
  })

  afterEach(() => httpMock.verify())

  function digitar(seletor: string, valor: string) {
    const campo = elemento.querySelector<HTMLInputElement>(seletor)
    if (!campo) throw new Error(`Campo ${seletor} não encontrado.`)
    campo.value = valor
    campo.dispatchEvent(new Event('input'))
  }

  const mensagensNaTela = () => textoDe(elemento.querySelector('p-card'))

  async function tentarLogin(): Promise<TestRequest> {
    digitar('#email', EMAIL_CONTA)
    digitar('#senha', SENHA_INCORRETA)
    await fixture.whenStable()
    botaoComTexto(elemento, 'Entrar').click()
    const requisicao = httpMock.expectOne({ method: 'POST', url: URL_LOGIN })
    expect(requisicao.request.body).toEqual({ email: EMAIL_CONTA, senha: SENHA_INCORRETA })
    return requisicao
  }

  async function responder(requisicao: TestRequest, status: number, corpo: object) {
    requisicao.flush(corpo, { status, statusText: status === 423 ? 'Locked' : 'Unauthorized' })
    await fixture.whenStable()
  }

  it('1ª e 2ª senha incorreta: mostra o erro de credenciais, sem mensagem de bloqueio', async () => {
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      await responder(await tentarLogin(), 401, RESPOSTA_SENHA_INCORRETA)
      expect(mensagensNaTela()).toContain('E-mail ou senha incorretos.')
      expect(mensagensNaTela()).not.toContain('bloqueada')
    }
  })

  it('exatamente na 3ª tentativa a tela exibe a mensagem de bloqueio de 30 min', async () => {
    await responder(await tentarLogin(), 401, RESPOSTA_SENHA_INCORRETA)
    await responder(await tentarLogin(), 401, RESPOSTA_SENHA_INCORRETA)
    expect(mensagensNaTela()).not.toContain('bloqueada') // não bloqueia na 2ª

    await responder(await tentarLogin(), 423, RESPOSTA_BLOQUEIO_NA_3A_TENTATIVA)

    expect(mensagensNaTela()).toContain('Conta bloqueada por 30 min.')
    expect(mensagensNaTela()).not.toContain('E-mail ou senha incorretos.')
  })

  it('tentativa aos 29 min é rejeitada: a tela mostra que a conta segue bloqueada e não entra', async () => {
    await responder(await tentarLogin(), 423, RESPOSTA_BLOQUEIO_NA_3A_TENTATIVA)

    await responder(await tentarLogin(), 423, RESPOSTA_BLOQUEIO_AOS_29_MIN)

    expect(mensagensNaTela()).toContain('Conta bloqueada temporariamente. Tente de novo em 1 min.')
    expect(mensagensNaTela()).not.toContain('Autenticação em duas etapas') // não avança ao MFA
  })

  it('2 falhas após o desbloqueio: a tela informa o bloqueio permanente e orienta procurar o suporte', async () => {
    await responder(await tentarLogin(), 423, RESPOSTA_BLOQUEIO_NA_3A_TENTATIVA)

    await responder(await tentarLogin(), 401, RESPOSTA_SENHA_INCORRETA)
    await responder(await tentarLogin(), 423, RESPOSTA_BLOQUEIO_PERMANENTE)

    expect(mensagensNaTela()).toContain(
      'Conta bloqueada por excesso de tentativas. Entre em contato com o suporte.',
    )
    expect(mensagensNaTela()).not.toContain('Autenticação em duas etapas')
  })
})
