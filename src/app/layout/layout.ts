import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { environment } from '../../../src/environments/environment';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class LayoutComponent implements OnInit {
  theme = environment.theme;
  constructor(private router: Router) { }

  ngOnInit() {
    document.documentElement.style.setProperty('--primary-color', this.theme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', this.theme.secondaryColor);
    document.documentElement.style.setProperty('--background-color', this.theme.background);
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}