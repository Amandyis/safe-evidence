import { Component, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { Observable, finalize } from 'rxjs'
import { CardModule } from 'primeng/card'
import { IconFieldModule } from 'primeng/iconfield'
import { InputOtpModule } from 'primeng/inputotp'
import { SignIn } from '@primeicons/angular/sign-in'
import { AutenticacaoService } from '../../services/autenticacao.service'
import { MensagemAlerta } from '../../shared/components/mensagem-alerta/mensagem-alerta'
import { SessaoService } from '../../services/sessao.service'
import { interpretarErroApi } from '../../shared/utils/erro-api'
import { isSenhaForte } from '../../shared/validators/cadastro.validators'

type EtapaLogin = 'credenciais' | 'codigo-mfa' | 'recuperacao-email' | 'recuperacao-nova-senha'

const QUANTIDADE_DIGITOS_CODIGO = 6

@Component({
  selector: 'app-login',
  imports: [CardModule, IconFieldModule, InputOtpModule, FormsModule, SignIn, MensagemAlerta],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly autenticacaoService = inject(AutenticacaoService)
  private readonly sessaoService = inject(SessaoService)
  private readonly router = inject(Router)

  protected readonly quantidadeDigitosCodigo = QUANTIDADE_DIGITOS_CODIGO

  protected readonly etapaAtual = signal<EtapaLogin>('credenciais')
  protected readonly isEnviando = signal(false)
  protected readonly isSenhaVisivel = signal(false)
  protected readonly mensagemErro = signal<string | null>(null)
  protected readonly mensagemSucesso = signal<string | null>(null)
  protected readonly mensagemAviso = signal<string | null>(
    this.sessaoService.consumirAvisoParaTelaLogin(),
  )

  protected readonly email = signal('')
  protected readonly senha = signal('')
  protected readonly codigoMfa = signal('')
  protected readonly emailMascarado = signal('')

  protected readonly emailRecuperacao = signal('')
  protected readonly codigoRecuperacao = signal('')
  protected readonly novaSenha = signal('')
  protected readonly confirmacaoNovaSenha = signal('')

  private tokenMfa = ''

  protected alternarVisibilidadeSenha() {
    this.isSenhaVisivel.update((isVisivel) => !isVisivel)
  }

  protected entrar() {
    if (!this.email().trim() || !this.senha()) {
      this.mensagemErro.set('Informe seu e-mail e sua senha.')
      return
    }

    this.executarRequisicao(
      this.autenticacaoService.entrar({ email: this.email().trim(), senha: this.senha() }),
      (respostaLogin) => {
        this.tokenMfa = respostaLogin.mfa_token
        this.emailMascarado.set(respostaLogin.email_mascarado)
        this.codigoMfa.set('')
        this.senha.set('')
        this.irParaEtapa('codigo-mfa')
      },
    )
  }

  protected verificarCodigoMfa() {
    if (this.codigoMfa().length !== QUANTIDADE_DIGITOS_CODIGO) {
      this.mensagemErro.set(`Digite os ${QUANTIDADE_DIGITOS_CODIGO} dígitos do código.`)
      return
    }

    this.executarRequisicao(
      this.autenticacaoService.validarCodigoMfa(this.tokenMfa, this.codigoMfa()),
      () => this.router.navigateByUrl('/inicio'),
    )
  }

  protected reenviarCodigoMfa() {
    this.executarRequisicao(
      this.autenticacaoService.reenviarCodigoMfa(this.tokenMfa),
      (respostaReenvio) => {
        this.tokenMfa = respostaReenvio.mfa_token
        this.codigoMfa.set('')
        this.mensagemSucesso.set('Enviamos um novo código para o seu e-mail.')
      },
    )
  }

  protected abrirRecuperacaoSenha() {
    this.emailRecuperacao.set(this.email())
    this.irParaEtapa('recuperacao-email')
  }

  protected solicitarRecuperacaoSenha() {
    if (!this.emailRecuperacao().trim()) {
      this.mensagemErro.set('Informe o e-mail cadastrado.')
      return
    }

    this.executarRequisicao(
      this.autenticacaoService.solicitarRecuperacaoSenha(this.emailRecuperacao().trim()),
      (respostaRecuperacao) => {
        this.irParaEtapa('recuperacao-nova-senha')
        this.mensagemSucesso.set(respostaRecuperacao.mensagem)
      },
    )
  }

  protected redefinirSenha() {
    const mensagemValidacao = this.validarNovaSenha()
    if (mensagemValidacao) {
      this.mensagemErro.set(mensagemValidacao)
      return
    }

    this.executarRequisicao(
      this.autenticacaoService.redefinirSenha({
        email: this.emailRecuperacao().trim(),
        codigo: this.codigoRecuperacao(),
        nova_senha: this.novaSenha(),
      }),
      (respostaRedefinicao) => {
        this.email.set(this.emailRecuperacao().trim())
        this.limparCamposRecuperacao()
        this.irParaEtapa('credenciais')
        this.mensagemSucesso.set(respostaRedefinicao.mensagem)
      },
    )
  }

  protected voltarParaLogin() {
    this.limparCamposRecuperacao()
    this.irParaEtapa('credenciais')
  }

  protected irParaCadastro() {
    this.router.navigateByUrl('/cadastro')
  }

  private validarNovaSenha(): string | null {
    if (this.codigoRecuperacao().length !== QUANTIDADE_DIGITOS_CODIGO) {
      return `Digite os ${QUANTIDADE_DIGITOS_CODIGO} dígitos do código recebido por e-mail.`
    }
    if (!isSenhaForte(this.novaSenha())) {
      return 'A senha precisa ter 8 ou mais caracteres, com letra maiúscula, minúscula, número e caractere especial.'
    }
    if (this.novaSenha() !== this.confirmacaoNovaSenha()) {
      return 'As senhas não conferem.'
    }
    return null
  }

  private limparCamposRecuperacao() {
    this.codigoRecuperacao.set('')
    this.novaSenha.set('')
    this.confirmacaoNovaSenha.set('')
  }

  private irParaEtapa(proximaEtapa: EtapaLogin) {
    this.mensagemErro.set(null)
    this.mensagemSucesso.set(null)
    this.mensagemAviso.set(null)
    this.etapaAtual.set(proximaEtapa)
  }

  private executarRequisicao<TipoResposta>(
    requisicao: Observable<TipoResposta>,
    aoConcluirComSucesso: (resposta: TipoResposta) => void,
  ) {
    this.mensagemErro.set(null)
    this.mensagemSucesso.set(null)
    this.isEnviando.set(true)

    requisicao.pipe(finalize(() => this.isEnviando.set(false))).subscribe({
      next: aoConcluirComSucesso,
      error: (erro: unknown) => this.mensagemErro.set(interpretarErroApi(erro).mensagem),
    })
  }
}
