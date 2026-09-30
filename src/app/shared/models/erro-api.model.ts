export interface RespostaErroApi {
  erro: string
  codigo?: string
  campos?: Record<string, string>
  minutos_restantes?: number
}

export interface ErroApi {
  status: number
  mensagem: string
  codigo: string | null
  errosPorCampo: Record<string, string>
}
