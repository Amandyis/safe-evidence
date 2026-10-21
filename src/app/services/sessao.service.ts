import { Injectable, computed, signal } from '@angular/core'
import { RespostaValidacaoMfa, UsuarioAutenticado } from '../shared/models/autenticacao.model'

export type MotivoEncerramentoSessao = 'logout' | 'inatividade' | 'expiracao' | 'exclusao-conta'

const CHAVE_ARMAZENAMENTO_TOKEN = 'safe-evidence:token'
const CHAVE_ARMAZENAMENTO_EXPIRACAO = 'safe-evidence:expira-em'
const CHAVE_ARMAZENAMENTO_USUARIO = 'safe-evidence:usuario'
const CHAVE_ARMAZENAMENTO_INATIVIDADE = 'safe-evidence:inatividade-minutos'
const CHAVE_ARMAZENAMENTO_ULTIMA_ATIVIDADE = 'safe-evidence:ultima-atividade'
const MILISSEGUNDOS_POR_MINUTO = 60_000

const AVISO_LOGIN_POR_MOTIVO: Record<MotivoEncerramentoSessao, string | null> = {
  logout: null,
  inatividade: 'Sua sessão expirou por inatividade. Entre novamente para continuar.',
  expiracao: 'Sua sessão foi encerrada. Entre novamente para continuar.',
  'exclusao-conta': 'Sua conta foi excluída com sucesso.',
}

function lerUsuarioArmazenado(): UsuarioAutenticado | null {
  const usuarioSerializado = localStorage.getItem(CHAVE_ARMAZENAMENTO_USUARIO)
  if (!usuarioSerializado) return null
  try {
    return JSON.parse(usuarioSerializado) as UsuarioAutenticado
  } catch {
    return null
  }
}

function lerNumeroArmazenado(chaveArmazenamento: string): number | null {
  const valorArmazenado = localStorage.getItem(chaveArmazenamento)
  if (valorArmazenado === null) return null
  const valorConvertido = Number(valorArmazenado)
  return Number.isFinite(valorConvertido) && valorConvertido > 0 ? valorConvertido : null
}

function lerExpiracaoArmazenada(): Date | null {
  const expiracaoSerializada = localStorage.getItem(CHAVE_ARMAZENAMENTO_EXPIRACAO)
  return expiracaoSerializada ? new Date(expiracaoSerializada) : null
}

@Injectable({ providedIn: 'root' })
export class SessaoService {
  private readonly tokenAcesso = signal<string | null>(
    localStorage.getItem(CHAVE_ARMAZENAMENTO_TOKEN),
  )
  private readonly dataExpiracao = signal<Date | null>(lerExpiracaoArmazenada())
  private readonly usuarioAutenticado = signal<UsuarioAutenticado | null>(lerUsuarioArmazenado())
  private readonly avisoParaTelaLogin = signal<string | null>(null)
  private readonly minutosInatividade = signal<number | null>(
    lerNumeroArmazenado(CHAVE_ARMAZENAMENTO_INATIVIDADE),
  )
  private readonly momentoUltimaAtividade = signal<number | null>(
    lerNumeroArmazenado(CHAVE_ARMAZENAMENTO_ULTIMA_ATIVIDADE),
  )

  readonly token = this.tokenAcesso.asReadonly()
  readonly usuarioLogado = this.usuarioAutenticado.asReadonly()
  readonly nomeUsuarioLogado = computed(() => this.usuarioAutenticado()?.nome ?? '')

  readonly momentoExpiracaoPorInatividade = computed(() => {
    const minutos = this.minutosInatividade()
    const ultimaAtividade = this.momentoUltimaAtividade()
    if (minutos === null || ultimaAtividade === null) return null
    return ultimaAtividade + minutos * MILISSEGUNDOS_POR_MINUTO
  })

  isAutenticado(): boolean {
    const expiracao = this.dataExpiracao()
    const isTokenPresente = this.tokenAcesso() !== null
    const isTokenDentroDaValidade = expiracao === null || expiracao.getTime() > Date.now()
    return isTokenPresente && isTokenDentroDaValidade
  }

  iniciarSessao(respostaValidacaoMfa: RespostaValidacaoMfa) {
    localStorage.setItem(CHAVE_ARMAZENAMENTO_TOKEN, respostaValidacaoMfa.token)
    localStorage.setItem(CHAVE_ARMAZENAMENTO_EXPIRACAO, respostaValidacaoMfa.expira_em)
    localStorage.setItem(CHAVE_ARMAZENAMENTO_USUARIO, JSON.stringify(respostaValidacaoMfa.usuario))
    localStorage.setItem(
      CHAVE_ARMAZENAMENTO_INATIVIDADE,
      String(respostaValidacaoMfa.inatividade_minutos),
    )

    this.tokenAcesso.set(respostaValidacaoMfa.token)
    this.dataExpiracao.set(new Date(respostaValidacaoMfa.expira_em))
    this.usuarioAutenticado.set(respostaValidacaoMfa.usuario)
    this.minutosInatividade.set(respostaValidacaoMfa.inatividade_minutos || null)
    this.registrarAtividade()
  }

  registrarAtividade() {
    if (this.tokenAcesso() === null) return
    const agora = Date.now()
    localStorage.setItem(CHAVE_ARMAZENAMENTO_ULTIMA_ATIVIDADE, String(agora))
    this.momentoUltimaAtividade.set(agora)
  }

  sincronizarUltimaAtividade() {
    const ultimaAtividadeArmazenada = lerNumeroArmazenado(CHAVE_ARMAZENAMENTO_ULTIMA_ATIVIDADE)
    if (ultimaAtividadeArmazenada !== null)
      this.momentoUltimaAtividade.set(ultimaAtividadeArmazenada)
  }

  atualizarDadosUsuario(dadosAtualizados: Pick<UsuarioAutenticado, 'nome' | 'email'>) {
    const usuarioAtual = this.usuarioAutenticado()
    if (!usuarioAtual) return

    const usuarioAtualizado = { ...usuarioAtual, ...dadosAtualizados }
    localStorage.setItem(CHAVE_ARMAZENAMENTO_USUARIO, JSON.stringify(usuarioAtualizado))
    this.usuarioAutenticado.set(usuarioAtualizado)
  }

  encerrarSessao(motivo: MotivoEncerramentoSessao) {
    localStorage.removeItem(CHAVE_ARMAZENAMENTO_TOKEN)
    localStorage.removeItem(CHAVE_ARMAZENAMENTO_EXPIRACAO)
    localStorage.removeItem(CHAVE_ARMAZENAMENTO_USUARIO)
    localStorage.removeItem(CHAVE_ARMAZENAMENTO_INATIVIDADE)
    localStorage.removeItem(CHAVE_ARMAZENAMENTO_ULTIMA_ATIVIDADE)

    this.tokenAcesso.set(null)
    this.dataExpiracao.set(null)
    this.usuarioAutenticado.set(null)
    this.minutosInatividade.set(null)
    this.momentoUltimaAtividade.set(null)
    this.avisoParaTelaLogin.set(AVISO_LOGIN_POR_MOTIVO[motivo])
  }

  definirAvisoParaTelaLogin(mensagemAviso: string) {
    this.avisoParaTelaLogin.set(mensagemAviso)
  }

  consumirAvisoParaTelaLogin(): string | null {
    const mensagemAviso = this.avisoParaTelaLogin()
    this.avisoParaTelaLogin.set(null)
    return mensagemAviso
  }
}
