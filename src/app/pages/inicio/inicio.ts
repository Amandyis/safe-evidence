import { Component } from '@angular/core'
import { TabelaEvidencias } from '../../shared/components/tabela-evidencias/tabela-evidencias'

@Component({
  selector: 'app-inicio',
  imports: [TabelaEvidencias],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {}
