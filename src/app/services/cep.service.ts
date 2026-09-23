import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, map } from 'rxjs'

interface ViaCepResposta {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean | string
}

export interface EnderecoCep {
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

@Injectable({ providedIn: 'root' })
export class CepService {
  private http = inject(HttpClient)

  /** Retorna o endereço do CEP (8 dígitos) ou null se o CEP não existir. */
  buscar(cep: string): Observable<EnderecoCep | null> {
    return this.http.get<ViaCepResposta>(`https://viacep.com.br/ws/${cep}/json/`).pipe(
      map((r) =>
        r.erro
          ? null
          : { logradouro: r.logradouro, bairro: r.bairro, cidade: r.localidade, uf: r.uf },
      ),
    )
  }
}
