export function formatarCpf(cpfSomenteDigitos: string): string {
  return cpfSomenteDigitos.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
}

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

const SEGUNDOS_POR_MINUTO = 60

export function converterDuracaoParaSegundos(duracaoMinutosSegundos: string): number {
  const [minutos, segundos] = duracaoMinutosSegundos.split(':').map(Number)
  return minutos * SEGUNDOS_POR_MINUTO + segundos
}

export function formatarSegundosComoDuracao(totalSegundos: number): string {
  const minutos = Math.floor(totalSegundos / SEGUNDOS_POR_MINUTO)
  const segundos = totalSegundos % SEGUNDOS_POR_MINUTO
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
}
