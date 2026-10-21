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
  return { status, mensagem, codigo: null, errosPorCampo: {}, gravacoesVinculadas: [] }
}

function normalizarErrosPorCampo(
  campos: Record<string, string | string[]> | undefined,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(campos ?? {}).map(([campo, mensagem]) => [
      campo,
      Array.isArray(mensagem) ? mensagem.join(', ') : mensagem,
    ]),
  )
}

export async function converterErroBlobEmJson(erro: unknown): Promise<unknown> {
  if (!(erro instanceof HttpErrorResponse) || !(erro.error instanceof Blob)) return erro
  try {
    const corpoResposta: unknown = JSON.parse(await erro.error.text())
    return new HttpErrorResponse({
      error: corpoResposta,
      headers: erro.headers,
      status: erro.status,
      statusText: erro.statusText,
      url: erro.url ?? undefined,
    })
  } catch {
    return erro
  }
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
    errosPorCampo: normalizarErrosPorCampo(erro.error.campos),
    gravacoesVinculadas: erro.error.gravacoes_vinculadas ?? [],
  }
}
