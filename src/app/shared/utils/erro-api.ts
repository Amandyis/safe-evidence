import { HttpErrorResponse } from '@angular/common/http'
import { ErroApi, RespostaErroApi } from '../models/erro-api.model'

const STATUS_SEM_CONEXAO = 0
const MENSAGEM_SEM_CONEXAO =
  'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
const MENSAGEM_ERRO_INESPERADO = 'Ocorreu um erro inesperado. Tente novamente.'

function isRespostaErroApi(corpoResposta: unknown): corpoResposta is RespostaErroApi {
  return (
    typeof corpoResposta === 'object' &&
    corpoResposta !== null &&
    typeof (corpoResposta as RespostaErroApi).erro === 'string'
  )
}

function criarErroSemDetalhes(status: number, mensagem: string): ErroApi {
  return { status, mensagem, codigo: null, errosPorCampo: {} }
}

export function interpretarErroApi(erro: unknown): ErroApi {
  if (!(erro instanceof HttpErrorResponse)) {
    return criarErroSemDetalhes(STATUS_SEM_CONEXAO, MENSAGEM_ERRO_INESPERADO)
  }

  if (erro.status === STATUS_SEM_CONEXAO) {
    return criarErroSemDetalhes(erro.status, MENSAGEM_SEM_CONEXAO)
  }

  if (!isRespostaErroApi(erro.error)) {
    return criarErroSemDetalhes(erro.status, MENSAGEM_ERRO_INESPERADO)
  }

  return {
    status: erro.status,
    mensagem: erro.error.erro,
    codigo: erro.error.codigo ?? null,
    errosPorCampo: erro.error.campos ?? {},
  }
}
