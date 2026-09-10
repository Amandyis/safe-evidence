import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
@Component({
  selector: 'app-login',
  imports: [CardModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {}
