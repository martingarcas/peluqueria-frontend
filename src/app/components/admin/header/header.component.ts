import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isMenuActive = false;
  cartItemCount = 0; // Esto se actualizará cuando implementemos el carrito
  userName: string = '';
  successMessage: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    const loginJson = sessionStorage.getItem('LOGIN');
    if (loginJson) {
      const loginData = JSON.parse(loginJson);
      this.userName = loginData.user.nombre || '';
    }
  }

  toggleMenu(): void {
    this.isMenuActive = !this.isMenuActive;
  }

  onUserAccessClick(): void {
    this.router.navigate(['/client/profile']);
    this.isMenuActive = false;
  }

  onCartClick(): void {
    this.router.navigate(['/cart']);
    this.isMenuActive = false;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.isMenuActive = false; // Cerrar menú móvil al navegar
  }

  logout(): void {
    this.successMessage = '¡Sesión cerrada correctamente!';
    // Esperar a que se muestre el mensaje
    setTimeout(() => {
      sessionStorage.removeItem('LOGIN');
      this.router.navigate(['/auth']);
    }, 1000);
  }
}
