export type FinalidadeCodigoVerificacao = 'alterar_dados' | 'excluir_conta'

export interface EnderecoPerfilApi {
  cep: string
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  uf: string
}

export interface DispositivoVinculadoApi {
  id_dispositivo: string
  status_bateria: number | null
}

export interface PerfilUsuarioApi {
  id_vitima: number
  nome: string
  cpf_mascarado: string
  email: string
  telefone: string
  endereco: EnderecoPerfilApi
  consentimento_em: string
  criada_em: string
  dispositivo: DispositivoVinculadoApi | null
}

export interface AtualizacaoPerfilApi {
  nome?: string
  email?: string
  telefone?: string
  endereco?: EnderecoPerfilApi
  nova_senha?: string
  codigo?: string
}

export interface EnderecoPerfil {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

export interface DispositivoVinculado {
  idDispositivo: string
  percentualBateria: number | null
}

export interface PerfilUsuario {
  idVitima: number
  nome: string
  cpfMascarado: string
  email: string
  telefone: string
  endereco: EnderecoPerfil
  consentimentoRegistradoEm: Date
  contaCriadaEm: Date
  dispositivo: DispositivoVinculado | null
}
