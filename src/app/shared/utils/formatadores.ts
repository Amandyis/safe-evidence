const SEGUNDOS_POR_MINUTO = 60
const CASAS_DECIMAIS_PERCENTUAL = 1
const DIGITOS_CODIGO_EVIDENCIA = 5

export function formatarTelefone(telefoneSomenteDigitos: string): string {
  return telefoneSomenteDigitos.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
}

export function formatarCep(cepSomenteDigitos: string): string {
  return cepSomenteDigitos.replace(/^(\d{5})(\d{3})$/, '$1-$2')
}

export function formatarDataPorExtenso(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(data)
}

export function formatarSegundosComoDuracao(totalSegundos: number): string {
  const segundosInteiros = Math.round(totalSegundos)
  const minutos = Math.floor(segundosInteiros / SEGUNDOS_POR_MINUTO)
  const segundos = segundosInteiros % SEGUNDOS_POR_MINUTO
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
}

export function formatarPercentual(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: CASAS_DECIMAIS_PERCENTUAL,
  }).format(valor)
}

export function formatarCodigoEvidencia(idGravacao: number, gravadaEm: Date): string {
  const idComZeros = String(idGravacao).padStart(DIGITOS_CODIGO_EVIDENCIA, '0')
  return `EVID-${gravadaEm.getFullYear()}-${idComZeros}`
}

export function removerCaracteresNaoNumericos(texto: string): string {
  return texto.replace(/\D/g, '')
}

const QUANTIDADE_DIGITOS_DATA = 8

export function aplicarMascaraData(textoDigitado: string): string {
  const digitos = removerCaracteresNaoNumericos(textoDigitado).slice(0, QUANTIDADE_DIGITOS_DATA)
  const dia = digitos.slice(0, 2)
  const mes = digitos.slice(2, 4)
  const ano = digitos.slice(4)
  return [dia, mes, ano].filter((parteData) => parteData.length > 0).join('/')
}

export function converterTextoParaData(dataDigitada: string): Date | null {
  const digitos = removerCaracteresNaoNumericos(dataDigitada)
  if (digitos.length !== QUANTIDADE_DIGITOS_DATA) return null

  const dia = Number(digitos.slice(0, 2))
  const mes = Number(digitos.slice(2, 4))
  const ano = Number(digitos.slice(4))
  const dataConvertida = new Date(ano, mes - 1, dia)

  const isDataExistente =
    dataConvertida.getFullYear() === ano &&
    dataConvertida.getMonth() === mes - 1 &&
    dataConvertida.getDate() === dia
  return isDataExistente ? dataConvertida : null
}
