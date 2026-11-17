import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms'

/** Valida CPF pelos dígitos verificadores (aceita com ou sem máscara). CT10 */
export const cpfValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const cpf = String(control.value ?? '').replace(/\D/g, '')
  if (!cpf) return null // "required" cuida do vazio

  // rejeita tamanho errado e sequências repetidas (000.000.000-00, 111..., etc.)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return { cpfInvalido: true }

  const digito = (len: number) => {
    let soma = 0
    for (let i = 0; i < len; i++) soma += Number(cpf[i]) * (len + 1 - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10])
    ? null
    : { cpfInvalido: true }
}

const TAMANHO_MINIMO_SENHA = 8

export function isSenhaForte(senha: string): boolean {
  return (
    senha.length >= TAMANHO_MINIMO_SENHA &&
    /[A-Z]/.test(senha) &&
    /[a-z]/.test(senha) &&
    /\d/.test(senha) &&
    /[^A-Za-z0-9]/.test(senha)
  )
}

/** Senha forte: 8+ caracteres, maiúscula, minúscula, número e caractere especial. RN03 */
export const senhaForteValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const senhaInformada = String(control.value ?? '')
  if (!senhaInformada) return null
  return isSenhaForte(senhaInformada) ? null : { senhaFraca: true }
}

/** Validador de grupo: confere se os dois campos de senha são iguais. */
export function senhasIguaisValidator(campoSenha: string, campoConfirmacao: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const senha = group.get(campoSenha)?.value
    const confirmacao = group.get(campoConfirmacao)?.value
    if (!senha || !confirmacao) return null
    return senha === confirmacao ? null : { senhasDiferentes: true }
  }
}
