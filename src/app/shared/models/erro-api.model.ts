export interface RespostaErroApi {
  erro: string
  codigo?: string
  campos?: Record<string, string | string[]>
  minutos_restantes?: number
  gravacoes_vinculadas?: number[]
}

export interface ErroApi {
  status: number
  mensagem: string
  codigo: string | null
  errosPorCampo: Record<string, string>
  gravacoesVinculadas: number[]
}
