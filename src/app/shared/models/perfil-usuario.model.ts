export interface InformacoesPessoais {
  nomeCompleto: string
  email: string
  cpf: string
  telefone: string
  dataNascimento: Date
}

export interface EnderecoEntrega {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

export interface PerfilUsuario {
  cargo: string
  informacoesPessoais: InformacoesPessoais
  enderecoEntrega: EnderecoEntrega
}
