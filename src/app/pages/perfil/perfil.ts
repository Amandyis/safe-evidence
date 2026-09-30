import { Component, computed, inject, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { finalize } from 'rxjs'
import { InputMaskModule } from 'primeng/inputmask'
import { InputTextModule } from 'primeng/inputtext'
import { SelectModule } from 'primeng/select'
import { SessaoService } from '../../services/sessao.service'
import { UsuarioService } from '../../services/usuario.service'
import { MensagemAlerta } from '../../shared/components/mensagem-alerta/mensagem-alerta'
import { ModalCodigoVerificacao } from '../../shared/components/modal-codigo-verificacao/modal-codigo-verificacao'
import { ModalConfirmacao } from '../../shared/components/modal-confirmacao/modal-confirmacao'
import { UNIDADES_FEDERATIVAS } from '../../shared/constants/unidades-federativas'
import {
  AtualizacaoPerfilApi,
  EnderecoPerfil,
  FinalidadeCodigoVerificacao,
  PerfilUsuario,
} from '../../shared/models/perfil-usuario.model'
import { interpretarErroApi } from '../../shared/utils/erro-api'
import {
  formatarCep,
  formatarDataPorExtenso,
  formatarTelefone,
} from '../../shared/utils/formatadores'

type GrupoFormularioPerfil = 'informacoesPessoais' | 'enderecoEntrega'

const STATUS_CONFLITO = 409
const CODIGO_ERRO_MFA_OBRIGATORIO = 'MFA_OBRIGATORIO'

const TEXTOS_MODAL_CODIGO_POR_FINALIDADE: Record<
  FinalidadeCodigoVerificacao,
  { titulo: string; textoBotaoConfirmar: string }
> = {
  alterar_dados: {
    titulo: 'Confirme a alteração dos seus dados',
    textoBotaoConfirmar: 'Salvar alterações',
  },
  excluir_conta: {
    titulo: 'Confirme a exclusão da sua conta',
    textoBotaoConfirmar: 'Excluir conta',
  },
}

@Component({
  selector: 'app-perfil',
  imports: [
    ReactiveFormsModule,
    InputMaskModule,
    InputTextModule,
    SelectModule,
    MensagemAlerta,
    ModalCodigoVerificacao,
    ModalConfirmacao,
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {
  private readonly formBuilder = inject(FormBuilder)
  private readonly router = inject(Router)
  private readonly usuarioService = inject(UsuarioService)
  private readonly sessaoService = inject(SessaoService)

  protected readonly unidadesFederativas = UNIDADES_FEDERATIVAS

  protected readonly perfilUsuario = signal<PerfilUsuario | null>(null)
  protected readonly isCarregandoPerfil = signal(true)
  protected readonly mensagemErroCarregamento = signal<string | null>(null)
  protected readonly mensagemErroAcao = signal<string | null>(null)
  protected readonly mensagemSucesso = signal<string | null>(null)

  protected readonly isModoEdicao = signal(false)
  protected readonly isSalvando = signal(false)
  protected readonly isModalSalvarVisivel = signal(false)
  protected readonly isModalExcluirVisivel = signal(false)

  protected readonly isModalCodigoVisivel = signal(false)
  protected readonly isProcessandoCodigo = signal(false)
  protected readonly mensagemErroCodigo = signal<string | null>(null)
  private readonly finalidadeCodigoPendente = signal<FinalidadeCodigoVerificacao | null>(null)
  private atualizacaoAguardandoCodigo: AtualizacaoPerfilApi | null = null

  protected readonly idDispositivoParaVincular = signal('')
  protected readonly isVinculandoDispositivo = signal(false)

  protected readonly perfilFormatado = computed(() => {
    const perfil = this.perfilUsuario()
    if (!perfil) return null
    return {
      telefone: formatarTelefone(perfil.telefone),
      cep: formatarCep(perfil.endereco.cep),
      contaCriadaEm: formatarDataPorExtenso(perfil.contaCriadaEm),
    }
  })

  protected readonly textosModalCodigo = computed(
    () => TEXTOS_MODAL_CODIGO_POR_FINALIDADE[this.finalidadeCodigoPendente() ?? 'alterar_dados'],
  )

  protected readonly formularioPerfil = this.formBuilder.nonNullable.group({
    informacoesPessoais: this.formBuilder.nonNullable.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
    }),
    enderecoEntrega: this.formBuilder.nonNullable.group({
      cep: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      logradouro: ['', Validators.required],
      numero: ['', Validators.required],
      complemento: [''],
      bairro: ['', Validators.required],
      cidade: ['', Validators.required],
      uf: ['', Validators.required],
    }),
  })

  constructor() {
    this.carregarPerfil()
  }

  protected carregarPerfil() {
    this.isCarregandoPerfil.set(true)
    this.mensagemErroCarregamento.set(null)

    this.usuarioService
      .buscarPerfil()
      .pipe(finalize(() => this.isCarregandoPerfil.set(false)))
      .subscribe({
        next: (perfil) => this.perfilUsuario.set(perfil),
        error: (erro: unknown) =>
          this.mensagemErroCarregamento.set(interpretarErroApi(erro).mensagem),
      })
  }

  protected isCampoInvalido(grupo: GrupoFormularioPerfil, nomeCampo: string): boolean {
    const campo = this.formularioPerfil.get([grupo, nomeCampo])
    return !!campo && campo.invalid && campo.touched
  }

  protected iniciarEdicao() {
    const perfil = this.perfilUsuario()
    if (!perfil) return

    this.formularioPerfil.reset({
      informacoesPessoais: { nome: perfil.nome, email: perfil.email, telefone: perfil.telefone },
      enderecoEntrega: perfil.endereco,
    })
    this.limparMensagens()
    this.isModoEdicao.set(true)
  }

  protected cancelarEdicao() {
    this.limparMensagens()
    this.isModoEdicao.set(false)
  }

  protected solicitarSalvamento() {
    if (this.formularioPerfil.invalid) {
      this.formularioPerfil.markAllAsTouched()
      return
    }
    this.isModalSalvarVisivel.set(true)
  }

  protected confirmarSalvamento() {
    const atualizacao = this.montarAtualizacaoPerfil()
    if (!atualizacao) {
      this.isModoEdicao.set(false)
      this.mensagemSucesso.set('Nenhuma alteração para salvar.')
      return
    }

    if (this.exigeCodigoVerificacao(atualizacao)) {
      this.atualizacaoAguardandoCodigo = atualizacao
      this.solicitarCodigoVerificacao('alterar_dados')
      return
    }

    this.enviarAtualizacao(atualizacao)
  }

  protected solicitarExclusaoConta() {
    this.limparMensagens()
    this.isModalExcluirVisivel.set(true)
  }

  protected confirmarExclusaoConta() {
    this.solicitarCodigoVerificacao('excluir_conta')
  }

  protected reenviarCodigoVerificacao() {
    const finalidade = this.finalidadeCodigoPendente()
    if (finalidade) this.solicitarCodigoVerificacao(finalidade)
  }

  protected confirmarCodigoVerificacao(codigoVerificacao: string) {
    const finalidade = this.finalidadeCodigoPendente()

    if (finalidade === 'excluir_conta') {
      this.excluirConta(codigoVerificacao)
    } else if (finalidade === 'alterar_dados' && this.atualizacaoAguardandoCodigo) {
      this.enviarAtualizacao(this.atualizacaoAguardandoCodigo, codigoVerificacao)
    }
  }

  protected cancelarVerificacaoCodigo() {
    this.fecharModalCodigo()
  }

  protected atualizarIdDispositivoParaVincular(eventoDigitacao: Event) {
    const campoIdentificador = eventoDigitacao.target as HTMLInputElement
    this.idDispositivoParaVincular.set(campoIdentificador.value)
  }

  protected vincularDispositivo() {
    const idDispositivo = this.idDispositivoParaVincular().trim()
    if (!idDispositivo) {
      this.mensagemErroAcao.set('Informe o identificador do dispositivo.')
      return
    }

    this.limparMensagens()
    this.isVinculandoDispositivo.set(true)

    this.usuarioService
      .vincularDispositivo(idDispositivo)
      .pipe(finalize(() => this.isVinculandoDispositivo.set(false)))
      .subscribe({
        next: () => {
          this.idDispositivoParaVincular.set('')
          this.mensagemSucesso.set('Dispositivo vinculado à sua conta.')
          this.carregarPerfil()
        },
        error: (erro: unknown) => this.mensagemErroAcao.set(interpretarErroApi(erro).mensagem),
      })
  }

  private enviarAtualizacao(atualizacao: AtualizacaoPerfilApi, codigoVerificacao?: string) {
    const corpoRequisicao = codigoVerificacao
      ? { ...atualizacao, codigo: codigoVerificacao }
      : atualizacao
    const indicadorCarregamento = codigoVerificacao ? this.isProcessandoCodigo : this.isSalvando

    this.limparMensagens()
    indicadorCarregamento.set(true)

    this.usuarioService
      .atualizarPerfil(corpoRequisicao)
      .pipe(finalize(() => indicadorCarregamento.set(false)))
      .subscribe({
        next: (perfilAtualizado) => {
          this.perfilUsuario.set(perfilAtualizado)
          this.fecharModalCodigo()
          this.isModoEdicao.set(false)
          this.mensagemSucesso.set('Perfil atualizado com sucesso.')
        },
        error: (erro: unknown) => {
          const erroApi = interpretarErroApi(erro)

          if (erroApi.codigo === CODIGO_ERRO_MFA_OBRIGATORIO && !codigoVerificacao) {
            this.atualizacaoAguardandoCodigo = atualizacao
            this.solicitarCodigoVerificacao('alterar_dados')
            return
          }

          if (this.isModalCodigoVisivel()) {
            this.mensagemErroCodigo.set(erroApi.mensagem)
          } else {
            this.mensagemErroAcao.set(erroApi.mensagem)
          }
        },
      })
  }

  private excluirConta(codigoVerificacao: string) {
    this.isProcessandoCodigo.set(true)

    this.usuarioService
      .excluirConta(codigoVerificacao)
      .pipe(finalize(() => this.isProcessandoCodigo.set(false)))
      .subscribe({
        next: () => {
          this.fecharModalCodigo()
          this.sessaoService.encerrarSessao('exclusao-conta')
          this.router.navigateByUrl('/login')
        },
        error: (erro: unknown) => {
          const erroApi = interpretarErroApi(erro)
          if (erroApi.status === STATUS_CONFLITO) {
            this.fecharModalCodigo()
            this.mensagemErroAcao.set(erroApi.mensagem)
            return
          }
          this.mensagemErroCodigo.set(erroApi.mensagem)
        },
      })
  }

  private solicitarCodigoVerificacao(finalidade: FinalidadeCodigoVerificacao) {
    this.finalidadeCodigoPendente.set(finalidade)
    this.mensagemErroCodigo.set(null)
    this.isProcessandoCodigo.set(true)

    this.usuarioService
      .solicitarCodigoVerificacao(finalidade)
      .pipe(finalize(() => this.isProcessandoCodigo.set(false)))
      .subscribe({
        next: () => this.isModalCodigoVisivel.set(true),
        error: (erro: unknown) => {
          const mensagemErro = interpretarErroApi(erro).mensagem
          if (this.isModalCodigoVisivel()) {
            this.mensagemErroCodigo.set(mensagemErro)
          } else {
            this.mensagemErroAcao.set(mensagemErro)
          }
        },
      })
  }

  private montarAtualizacaoPerfil(): AtualizacaoPerfilApi | null {
    const perfil = this.perfilUsuario()
    if (!perfil) return null

    const { informacoesPessoais, enderecoEntrega } = this.formularioPerfil.getRawValue()
    const atualizacao: AtualizacaoPerfilApi = {}

    const nomeInformado = informacoesPessoais.nome.trim()
    const emailInformado = informacoesPessoais.email.trim()

    if (nomeInformado !== perfil.nome) atualizacao.nome = nomeInformado
    if (emailInformado !== perfil.email) atualizacao.email = emailInformado
    if (informacoesPessoais.telefone !== perfil.telefone) {
      atualizacao.telefone = informacoesPessoais.telefone
    }
    if (this.isEnderecoAlterado(perfil.endereco, enderecoEntrega)) {
      atualizacao.endereco = {
        ...enderecoEntrega,
        complemento: enderecoEntrega.complemento.trim() || null,
      }
    }

    return Object.keys(atualizacao).length > 0 ? atualizacao : null
  }

  private isEnderecoAlterado(enderecoAtual: EnderecoPerfil, enderecoInformado: EnderecoPerfil) {
    const camposEndereco = Object.keys(enderecoAtual) as (keyof EnderecoPerfil)[]
    return camposEndereco.some(
      (campoEndereco) => enderecoAtual[campoEndereco] !== enderecoInformado[campoEndereco],
    )
  }

  private exigeCodigoVerificacao(atualizacao: AtualizacaoPerfilApi): boolean {
    return atualizacao.email !== undefined || atualizacao.telefone !== undefined
  }

  private fecharModalCodigo() {
    this.isModalCodigoVisivel.set(false)
    this.finalidadeCodigoPendente.set(null)
    this.mensagemErroCodigo.set(null)
    this.atualizacaoAguardandoCodigo = null
  }

  private limparMensagens() {
    this.mensagemErroAcao.set(null)
    this.mensagemSucesso.set(null)
  }
}
