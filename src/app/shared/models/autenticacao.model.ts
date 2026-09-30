export interface CredenciaisLogin {
  email: string
  senha: string
}

export interface RespostaLogin {
  mfa_token: string
  validade_minutos: number
  email_mascarado: string
  mensagem: string
}

export interface UsuarioAutenticado {
  id_vitima: number
  nome: string
  email: string
}

export interface RespostaValidacaoMfa {
  token: string
  expira_em: string
  inatividade_minutos: number
  usuario: UsuarioAutenticado
}

export interface RespostaReenvioMfa {
  mfa_token: string
  validade_minutos: number
}

export interface RespostaComMensagem {
  mensagem: string
}

export interface EnderecoCadastro {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

export interface SolicitacaoCadastro {
  nome: string
  cpf: string
  email: string
  telefone: string
  senha: string
  endereco: EnderecoCadastro
  consentimento: boolean
}

export interface RespostaCadastro {
  id_vitima: number
  mensagem: string
}

export interface SolicitacaoRedefinicaoSenha {
  email: string
  codigo: string
  nova_senha: string
}
