import { FormControl, FormGroup } from '@angular/forms'
import {
  cpfValidator,
  isSenhaForte,
  senhaForteValidator,
  senhasIguaisValidator,
} from './cadastro.validators'

describe('CT10 – Validadores do cadastro', () => {
  const validarCpf = (cpf: string) => cpfValidator(new FormControl(cpf))

  it('recusa o CPF 000.000.000-00 citado no caso de teste', () => {
    expect(validarCpf('000.000.000-00')).toEqual({ cpfInvalido: true })
  })

  it('recusa sequências repetidas, tamanho errado e dígitos verificadores errados', () => {
    for (const cpf of ['111.111.111-11', '999.999.999-99', '123.456.789', '529.982.247-24']) {
      expect(validarCpf(cpf)).toEqual({ cpfInvalido: true })
    }
  })

  it('aceita CPF válido com ou sem máscara', () => {
    expect(validarCpf('529.982.247-25')).toBeNull()
    expect(validarCpf('52998224725')).toBeNull()
  })

  it('senha forte exige 8+ caracteres, maiúscula, minúscula, número e caractere especial (RN03)', () => {
    expect(isSenhaForte('Teste@1234')).toBe(true)
    for (const senhaFraca of ['Te@1', 'teste@1234', 'TESTE@1234', 'Teste@abcd', 'Teste12345']) {
      expect(isSenhaForte(senhaFraca)).toBe(false)
    }
    expect(senhaForteValidator(new FormControl('teste1234'))).toEqual({ senhaFraca: true })
  })

  it('confirmação de senha diferente é recusada', () => {
    const grupo = new FormGroup(
      { senha: new FormControl('Teste@1234'), confirmacao: new FormControl('Teste@12345') },
      { validators: senhasIguaisValidator('senha', 'confirmacao') },
    )
    expect(grupo.hasError('senhasDiferentes')).toBe(true)
  })
})
