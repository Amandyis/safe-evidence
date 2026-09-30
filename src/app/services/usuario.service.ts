import { Injectable, signal } from '@angular/core'
import {
  EnderecoEntrega,
  InformacoesPessoais,
  PerfilUsuario,
} from '../shared/models/perfil-usuario.model'

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly perfilUsuarioLogado = signal<PerfilUsuario>({
    cargo: 'Legal Practitioner',
    informacoesPessoais: {
      nomeCompleto: 'Mariana Silva dos Santos',
      email: 'mariana.silva@evidencevault.gov.br',
      cpf: '52998224725',
      telefone: '11987654321',
      dataNascimento: new Date(1988, 2, 15),
    },
    enderecoEntrega: {
      cep: '01310100',
      logradouro: 'Avenida Paulista',
      numero: '1578',
      complemento: 'Andar 12, Sala 1204',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    },
  })

  readonly perfilUsuario = this.perfilUsuarioLogado.asReadonly()

  atualizarPerfil(informacoesPessoais: InformacoesPessoais, enderecoEntrega: EnderecoEntrega) {
    this.perfilUsuarioLogado.update((perfilAtual) => ({
      ...perfilAtual,
      informacoesPessoais,
      enderecoEntrega,
    }))
  }

  excluirConta() {
    console.log('conta excluída:', this.perfilUsuarioLogado().informacoesPessoais.email)
  }
}
