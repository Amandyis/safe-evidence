import { Component, inject, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { finalize } from 'rxjs'
import { CardModule } from 'primeng/card'
import { ButtonModule } from 'primeng/button'
import { InputTextModule } from 'primeng/inputtext'
import { IconFieldModule } from 'primeng/iconfield'
import { InputMaskModule } from 'primeng/inputmask'
import { DatePickerModule } from 'primeng/datepicker'
import { SelectModule } from 'primeng/select'
import { CheckboxModule } from 'primeng/checkbox'
import {
  cpfValidator,
  senhaForteValidator,
  senhasIguaisValidator,
} from '../../shared/validators/cadastro.validators'
import { CepService } from '../../services/cep.service'
import { AutenticacaoService } from '../../services/autenticacao.service'
import { SessaoService } from '../../services/sessao.service'
import { MensagemAlerta } from '../../shared/components/mensagem-alerta/mensagem-alerta'
import { SolicitacaoCadastro } from '../../shared/models/autenticacao.model'
import { interpretarErroApi } from '../../shared/utils/erro-api'
import { aplicarMascaraData, converterTextoParaData } from '../../shared/utils/formatadores'
import { TERMOS } from './termos'

type Etapa = 1 | 2 | 3
type Grupo = 'conta' | 'endereco' | 'termos'

const ETAPA_POR_GRUPO: Record<Grupo, Etapa> = { conta: 1, endereco: 2, termos: 3 }

const CAMPO_FORMULARIO_POR_CAMPO_API: Record<string, [Grupo, string]> = {
  nome: ['conta', 'nome'],
  email: ['conta', 'email'],
  cpf: ['conta', 'cpf'],
  telefone: ['conta', 'telefone'],
  senha: ['conta', 'senha'],
  cep: ['endereco', 'cep'],
  logradouro: ['endereco', 'logradouro'],
  numero: ['endereco', 'numero'],
  complemento: ['endereco', 'complemento'],
  bairro: ['endereco', 'bairro'],
  cidade: ['endereco', 'cidade'],
  uf: ['endereco', 'uf'],
  consentimento: ['termos', 'aceite'],
}

const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

@Component({
  selector: 'app-cadastro',
  imports: [
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputMaskModule,
    DatePickerModule,
    SelectModule,
    CheckboxModule,
    MensagemAlerta,
  ],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.scss',
})
export class Cadastro {
  private fb = inject(FormBuilder)
  private router = inject(Router)
  private cepService = inject(CepService)
  private readonly autenticacaoService = inject(AutenticacaoService)
  private readonly sessaoService = inject(SessaoService)

  protected readonly ufs = UFS
  protected readonly termos = TERMOS
  protected readonly hoje = new Date()
  protected readonly dataMinimaNascimento = new Date(1900, 0, 1)

  protected readonly etapas: { n: Etapa; label: string }[] = [
    { n: 1, label: 'Conta' },
    { n: 2, label: 'Endereço' },
    { n: 3, label: 'Confirmação' },
  ]
  protected readonly etapa = signal<Etapa>(1)

  protected readonly showSenha = signal(false)
  protected readonly showConfirmarSenha = signal(false)
  protected readonly buscandoCep = signal(false)
  protected readonly erroCep = signal<string | null>(null)
  protected readonly enviando = signal(false)
  protected readonly mensagemErroEnvio = signal<string | null>(null)
  protected readonly mensagensErroPorCampo = signal<string[]>([])

  protected readonly form = this.fb.nonNullable.group({
    conta: this.fb.nonNullable.group(
      {
        nome: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        cpf: ['', [Validators.required, cpfValidator]], // só dígitos (unmask)
        telefone: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
        nascimento: this.fb.control<Date | null>(null, Validators.required),
        senha: ['', [Validators.required, senhaForteValidator]],
        confirmarSenha: ['', Validators.required],
      },
      { validators: senhasIguaisValidator('senha', 'confirmarSenha') },
    ),
    endereco: this.fb.nonNullable.group({
      cep: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      logradouro: ['', Validators.required],
      numero: ['', Validators.required],
      complemento: [''],
      bairro: ['', Validators.required],
      cidade: ['', Validators.required],
      uf: ['', Validators.required],
      referencia: [''],
    }),
    termos: this.fb.nonNullable.group({
      aceite: [false, Validators.requiredTrue],
    }),
  })

  /** true quando o campo é inválido e a usuária já interagiu com ele */
  protected aoDigitarDataNascimento(eventoDigitacao: Event) {
    const campoData = eventoDigitacao.target as HTMLInputElement
    const dataComMascara = aplicarMascaraData(campoData.value)
    campoData.value = dataComMascara

    const dataInformada = converterTextoParaData(dataComMascara)
    const isDentroDoIntervalo =
      dataInformada !== null &&
      dataInformada >= this.dataMinimaNascimento &&
      dataInformada <= this.hoje
    if (isDentroDoIntervalo) {
      this.form.controls.conta.controls.nascimento.setValue(dataInformada)
    }
  }

  protected invalido(grupo: Grupo, campo: string): boolean {
    const c = this.form.get([grupo, campo])
    return !!c && c.invalid && c.touched
  }

  protected get senhasDiferentes(): boolean {
    const conta = this.form.controls.conta
    return conta.hasError('senhasDiferentes') && conta.controls.confirmarSenha.touched
  }

  protected toggleSenha() {
    this.showSenha.update((v) => !v)
  }

  protected toggleConfirmarSenha() {
    this.showConfirmarSenha.update((v) => !v)
  }

  protected avancar() {
    const grupo = this.etapa() === 1 ? this.form.controls.conta : this.form.controls.endereco
    if (grupo.invalid) {
      grupo.markAllAsTouched()
      return
    }
    this.etapa.update((e) => (e + 1) as Etapa)
  }

  protected voltar() {
    this.etapa.update((e) => (e - 1) as Etapa)
  }

  protected buscarCep() {
    const cep = this.form.controls.endereco.controls.cep.value
    if (!/^\d{8}$/.test(cep)) {
      this.erroCep.set('Informe um CEP com 8 dígitos.')
      return
    }

    this.erroCep.set(null)
    this.buscandoCep.set(true)
    this.cepService
      .buscar(cep)
      .pipe(finalize(() => this.buscandoCep.set(false)))
      .subscribe({
        next: (end) => {
          if (!end) {
            this.erroCep.set('CEP não encontrado. Preencha o endereço manualmente.')
            return
          }
          this.form.controls.endereco.patchValue(end)
        },
        error: () =>
          this.erroCep.set('Não foi possível consultar o CEP. Preencha o endereço manualmente.'),
      })
  }

  /** Enter no teclado: nas etapas 1 e 2 avança; na 3 conclui */
  protected onSubmit() {
    if (this.etapa() < 3) this.avancar()
    else this.concluir()
  }

  protected concluir() {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      if (this.form.controls.conta.invalid) this.etapa.set(1)
      else if (this.form.controls.endereco.invalid) this.etapa.set(2)
      return
    }

    const { conta, endereco } = this.form.getRawValue()
    const solicitacaoCadastro: SolicitacaoCadastro = {
      nome: conta.nome,
      email: conta.email,
      cpf: conta.cpf,
      telefone: conta.telefone,
      senha: conta.senha,
      endereco,
      consentimento: true,
    }

    this.mensagemErroEnvio.set(null)
    this.mensagensErroPorCampo.set([])
    this.enviando.set(true)

    this.autenticacaoService
      .cadastrar(solicitacaoCadastro)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (respostaCadastro) => {
          this.sessaoService.definirAvisoParaTelaLogin(
            `${respostaCadastro.mensagem} Entre com seu e-mail e senha.`,
          )
          this.router.navigateByUrl('/login')
        },
        error: (erro: unknown) => {
          const erroApi = interpretarErroApi(erro)
          this.mensagemErroEnvio.set(erroApi.mensagem)
          this.aplicarErrosDoServidor(erroApi.errosPorCampo)
        },
      })
  }

  private aplicarErrosDoServidor(errosPorCampo: Record<string, string>) {
    const etapasComErro: Etapa[] = []

    for (const [campoApi, mensagemErro] of Object.entries(errosPorCampo)) {
      const nomeCampoSemPrefixo = campoApi.replace(/^endereco\./, '')
      const campoFormulario = CAMPO_FORMULARIO_POR_CAMPO_API[nomeCampoSemPrefixo]
      if (!campoFormulario) continue

      const [grupo, nomeCampo] = campoFormulario
      const controle = this.form.get([grupo, nomeCampo])
      controle?.setErrors({ ...controle.errors, servidor: mensagemErro })
      controle?.markAsTouched()
      etapasComErro.push(ETAPA_POR_GRUPO[grupo])
    }

    this.mensagensErroPorCampo.set(Object.values(errosPorCampo))
    if (etapasComErro.length > 0) {
      this.etapa.set(Math.min(...etapasComErro) as Etapa)
    }
  }

  protected onJaTenhoConta() {
    this.router.navigateByUrl('/login')
  }
}
