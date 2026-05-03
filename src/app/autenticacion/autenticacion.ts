import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutenticacionService } from './autenticacion.service';
import { environment } from '../../../src/environments/environment';

@Component({
  selector: 'app-autenticacion',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './autenticacion.html',
  styleUrl: './autenticacion.css',
})
export class Autenticacion implements OnInit {
  username = '';
  password = '';
  theme = environment.theme;


  constructor(private authService: AutenticacionService, private router: Router) { }

  ngOnInit() {

    document.documentElement.style.setProperty('--primary-color', this.theme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', this.theme.secondaryColor);
    document.documentElement.style.setProperty('--background-color', this.theme.background);
  }

  login() {
    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        console.log('Login exitoso con token:', res);
        this.router.navigate(['/pacientes']);
      },
      error: err => {
        console.error('Error en el login', err);
      }
    });
  }
}