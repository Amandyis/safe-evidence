import { StatusAnalise, Veredicto } from '../../shared/models/evidencia.model'

export type TipoLegenda = 'status-analise' | 'veredicto'

export interface SecaoManual {
  id: string
  titulo: string
  classeIcone: string
  introducao: string
  passos?: string[]
  observacoes?: string[]
  tipoLegenda?: TipoLegenda
}

export interface PerguntaFrequente {
  pergunta: string
  resposta: string
}

export interface CanalEmergencia {
  nome: string
  numeroExibido: string
  linkDiscagem: string
  descricao: string
}

export const CANAIS_EMERGENCIA: CanalEmergencia[] = [
  {
    nome: 'Polícia Militar',
    numeroExibido: '190',
    linkDiscagem: 'tel:190',
    descricao: 'Em situação de perigo imediato, ligue antes de qualquer outra ação.',
  },
  {
    nome: 'Central de Atendimento à Mulher',
    numeroExibido: '180',
    linkDiscagem: 'tel:180',
    descricao: 'Gratuito, sigiloso e 24 horas. Orienta sobre direitos e rede de apoio.',
  },
]

export const DESCRICAO_POR_STATUS_ANALISE: Record<StatusAnalise, string> = {
  Pendente: 'O vídeo foi recebido e está na fila para a análise automática.',
  Processando: 'A inteligência artificial está analisando o vídeo neste momento.',
  Concluido: 'A análise terminou e o laudo já pode ser consultado e baixado.',
  Erro: 'A análise não pôde ser concluída. Você pode solicitar uma nova análise.',
}

export const DESCRICAO_POR_VEREDICTO: Record<Veredicto, string> = {
  'Alerta Alto': 'Foram identificados sinais fortes de agressividade no vídeo.',
  Anomalia: 'Foram identificados comportamentos fora do padrão que merecem atenção.',
  Normal: 'Não foram identificados sinais de agressividade.',
}

export const SECOES_MANUAL: SecaoManual[] = [
  {
    id: 'primeiros-passos',
    titulo: 'Primeiros passos',
    classeIcone: 'pi pi-flag',
    introducao:
      'O Safe Evidence guarda com segurança os vídeos gravados pelo seu dispositivo e os organiza como evidências.',
    passos: [
      'Crie sua conta pela opção "Primeiro acesso?" na tela de login e aceite os termos de uso.',
      'Entre com seu e-mail e senha.',
      'Digite o código de 6 dígitos enviado para o seu e-mail. Ele vale por 5 minutos.',
      'Pronto: você verá a galeria com as suas evidências.',
    ],
    observacoes: [
      'Por segurança, a sessão é encerrada após 15 minutos sem uso e dura no máximo 8 horas.',
      'Esqueceu a senha? Use "Esqueceu sua senha?" na tela de login para receber um código de recuperação.',
    ],
  },
  {
    id: 'vincular-dispositivo',
    titulo: 'Vincular seu dispositivo',
    classeIcone: 'pi pi-link',
    introducao:
      'Cada conta usa um dispositivo de captura. O vínculo é feito uma única vez, depois do primeiro login.',
    passos: [
      'Abra "Meu Perfil" no menu lateral.',
      'No quadro "Dispositivo de Captura", digite o identificador impresso na etiqueta do seu equipamento.',
      'Clique em "Vincular dispositivo".',
      'O identificador e o nível de bateria passam a aparecer no seu perfil.',
    ],
    observacoes: [
      'Um dispositivo só pode estar vinculado a uma conta. Se aparecer que ele já está em uso, entre em contato com o suporte.',
    ],
  },
  {
    id: 'gravar',
    titulo: 'Como gravar uma evidência',
    classeIcone: 'pi pi-video',
    introducao:
      'A gravação é iniciada e encerrada pelo acionador do seu dispositivo, sem precisar abrir o portal.',
    passos: [
      'Acione a gravação pelo seu dispositivo quando se sentir em risco.',
      'A câmera envia as imagens para o servidor enquanto grava.',
      'Ao encerrar, o vídeo é montado, recebe uma assinatura digital (SHA-256) e é enviado para análise.',
      'Em poucos instantes, a nova evidência aparece na sua galeria.',
    ],
    observacoes: [
      'Mantenha o dispositivo carregado e conectado à internet para que as imagens cheguem ao servidor.',
    ],
  },
  {
    id: 'acompanhar',
    titulo: 'Acompanhar suas evidências',
    classeIcone: 'pi pi-th-large',
    introducao:
      'A galeria mostra todas as suas gravações, da mais recente para a mais antiga. O status muda sozinho, sem precisar recarregar a página.',
    passos: [
      'Use o campo de pesquisa para encontrar uma evidência pelo código, dispositivo ou resultado.',
      'Clique em "Filtros" para filtrar por data de gravação ou status da análise.',
      'Clique no botão de reproduzir do cartão para abrir os detalhes.',
    ],
    tipoLegenda: 'status-analise',
  },
  {
    id: 'laudo',
    titulo: 'Entender o laudo da análise',
    classeIcone: 'pi pi-shield',
    introducao:
      'Quando a análise termina, a tela da evidência mostra o resultado produzido pela inteligência artificial.',
    passos: [
      'Índice de probabilidade de agressão: quanto maior o percentual, mais sinais de agressividade foram encontrados.',
      'Linha do tempo: as barras vermelhas e amarelas marcam os trechos do vídeo em que esses sinais aparecem.',
      'Metadados do arquivo: data, duração, dispositivo e a assinatura digital (hash) do vídeo.',
      'Use "Verificar" ao lado do hash para confirmar que o vídeo não foi alterado desde a gravação.',
    ],
    observacoes: [
      'O laudo é um apoio técnico. Ele não substitui a avaliação de autoridades, advogados ou profissionais da rede de proteção.',
    ],
    tipoLegenda: 'veredicto',
  },
  {
    id: 'baixar',
    titulo: 'Baixar e usar como prova',
    classeIcone: 'pi pi-download',
    introducao:
      'Você pode baixar o vídeo e o laudo para apresentar a uma delegacia, à Defensoria Pública ou ao seu advogado.',
    passos: [
      '"Download de Segurança" baixa o vídeo original e, quando houver, o laudo da análise.',
      '"Baixar Relatório IA" baixa apenas o laudo.',
      'Guarde os arquivos sem editá-los: qualquer alteração muda a assinatura digital e pode enfraquecer a prova.',
    ],
    observacoes: [
      'Por segurança, o link do vídeo vale por 15 minutos. Se expirar, basta abrir a evidência de novo.',
    ],
  },
  {
    id: 'conta',
    titulo: 'Seu perfil e sua conta',
    classeIcone: 'pi pi-user',
    introducao:
      'Mantenha seus dados atualizados para receber os códigos e o equipamento corretamente.',
    passos: [
      'Em "Meu Perfil", clique em "Editar Perfil", altere os dados e clique em "Salvar Perfil".',
      'Para trocar e-mail ou telefone, confirme com o código enviado ao seu e-mail.',
      'Para excluir a conta, clique em "Excluir Conta" e confirme com o código recebido.',
    ],
    observacoes: [
      'Evidências vinculadas a um processo judicial não podem ser apagadas, nem a conta que as possui.',
    ],
  },
  {
    id: 'seguranca',
    titulo: 'Dicas de segurança',
    classeIcone: 'pi pi-lock',
    introducao: 'Alguns cuidados ajudam a manter suas evidências e sua privacidade protegidas.',
    passos: [
      'Não compartilhe sua senha nem os códigos recebidos por e-mail. A equipe nunca pede esses dados.',
      'Em computadores ou celulares compartilhados, clique em "Sair" ao terminar e use a navegação anônima.',
      'Use uma senha exclusiva para o Safe Evidence, diferente das senhas de outros serviços.',
      'Se suspeitar que alguém acessou sua conta, troque a senha pela opção "Esqueceu sua senha?".',
    ],
  },
]

export const PERGUNTAS_FREQUENTES: PerguntaFrequente[] = [
  {
    pergunta: 'Não recebi o código no meu e-mail. O que faço?',
    resposta:
      'Confira a caixa de spam e o lixo eletrônico. Se o código não chegar em alguns minutos, use "Reenviar código".',
  },
  {
    pergunta: 'Minha evidência está com o status "Erro".',
    resposta:
      'Abra a evidência e clique em "Solicitar nova análise". O vídeo continua guardado com segurança enquanto isso.',
  },
  {
    pergunta: 'Posso apagar um vídeo?',
    resposta:
      'Sim, pelo botão "Deletar Vídeo" na tela da evidência. A exclusão é permanente e não é permitida quando o vídeo está vinculado a um processo judicial.',
  },
  {
    pergunta: 'Minha conta foi bloqueada ao tentar entrar.',
    resposta:
      'Após várias tentativas de senha incorretas, o acesso é bloqueado temporariamente. Aguarde o tempo informado ou fale com o suporte.',
  },
]
