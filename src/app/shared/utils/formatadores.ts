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
