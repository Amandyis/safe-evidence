import { Component, computed, inject, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { DatePickerModule } from 'primeng/datepicker'
import { InputMaskModule } from 'primeng/inputmask'
import { InputTextModule } from 'primeng/inputtext'
import { SelectModule } from 'primeng/select'
import { UsuarioService } from '../../services/usuario.service'
import { ModalConfirmacao } from '../../shared/components/modal-confirmacao/modal-confirmacao'
import { UNIDADES_FEDERATIVAS } from '../../shared/constants/unidades-federativas'
import {
  formatarCep,
  formatarCpf,
  formatarDataPorExtenso,
  formatarTelefone,
} from '../../shared/utils/formatadores'
import { cpfValidator } from '../../shared/validators/cadastro.validators'

type GrupoFormularioPerfil = 'informacoesPessoais' | 'enderecoEntrega'

@Component({
  selector: 'app-perfil',
  imports: [
    ReactiveFormsModule,
    DatePickerModule,
    InputMaskModule,
    InputTextModule,
    SelectModule,
    ModalConfirmacao,
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {
  private readonly formBuilder = inject(FormBuilder)
  private readonly router = inject(Router)
  private readonly usuarioService = inject(UsuarioService)

  protected readonly unidadesFederativas = UNIDADES_FEDERATIVAS
  protected readonly dataAtual = new Date()

  protected readonly isModoEdicao = signal(false)
  protected readonly isModalSalvarVisivel = signal(false)
  protected readonly isModalExcluirVisivel = signal(false)

  protected readonly perfilUsuario = this.usuarioService.perfilUsuario

  protected readonly perfilFormatado = computed(() => {
    const { informacoesPessoais, enderecoEntrega } = this.perfilUsuario()
    return {
      cpf: formatarCpf(informacoesPessoais.cpf),
      telefone: formatarTelefone(informacoesPessoais.telefone),
      dataNascimento: formatarDataPorExtenso(informacoesPessoais.dataNascimento),
      cep: formatarCep(enderecoEntrega.cep),
    }
  })

  protected readonly formularioPerfil = this.formBuilder.nonNullable.group({
    informacoesPessoais: this.formBuilder.nonNullable.group({
      nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      cpf: ['', [Validators.required, cpfValidator]],
      telefone: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      dataNascimento: this.formBuilder.control<Date | null>(null, Validators.required),
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

  protected isCampoInvalido(grupo: GrupoFormularioPerfil, nomeCampo: string): boolean {
    const campo = this.formularioPerfil.get([grupo, nomeCampo])
    return !!campo && campo.invalid && campo.touched
  }

  protected iniciarEdicao() {
    const { informacoesPessoais, enderecoEntrega } = this.perfilUsuario()
    this.formularioPerfil.reset({ informacoesPessoais, enderecoEntrega })
    this.isModoEdicao.set(true)
  }

  protected cancelarEdicao() {
    this.isModoEdicao.set(false)
  }

  protected solicitarSalvamento() {
    if (this.formularioPerfil.invalid) {
      this.formularioPerfil.markAllAsTouched()
      return
    }
    this.isModalSalvarVisivel.set(true)
  }

  protected salvarPerfil() {
    const { informacoesPessoais, enderecoEntrega } = this.formularioPerfil.getRawValue()
    if (!informacoesPessoais.dataNascimento) return

    this.usuarioService.atualizarPerfil(
      { ...informacoesPessoais, dataNascimento: informacoesPessoais.dataNascimento },
      enderecoEntrega,
    )
    this.isModoEdicao.set(false)
  }

  protected solicitarExclusaoConta() {
    this.isModalExcluirVisivel.set(true)
  }

  protected excluirConta() {
    this.usuarioService.excluirConta()
    this.router.navigateByUrl('/login')
  }
}
