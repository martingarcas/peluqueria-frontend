import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  isMenuActive = false;
  cartItemCount = 0; // Esto se actualizará cuando implementemos el carrito

  constructor(private router: Router) {}

  toggleMenu(): void {
    this.isMenuActive = !this.isMenuActive;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.isMenuActive = false; // Cerrar menú móvil al navegar
  }

  onUserAccessClick(): void {
    // Aquí implementaremos la lógica de acceso del usuario
    this.router.navigate(['/login']);
  }

  onCartClick(): void {
    // Aquí implementaremos la navegación al carrito
    this.router.navigate(['/cart']);
  }
}
