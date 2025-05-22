import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CarritoService } from 'src/app/services/carrito/carrito.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-client-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMenuActive = false;
  cartItemCount = 0; // Esto se actualizará cuando implementemos el carrito
  userName: string = '';
  successMessage: string = '';
  private carritoSub: Subscription | undefined;

  constructor(private router: Router, private carritoService: CarritoService) {}

  ngOnInit() {
    const loginJson = sessionStorage.getItem('LOGIN');
    if (loginJson) {
      const loginData = JSON.parse(loginJson);
      this.userName = loginData.user.nombre || '';
    }
    // Suscribirse al contador del carrito
    this.carritoSub = this.carritoService.cartItemCount$.subscribe(count => {
      this.cartItemCount = count;
    });
    // Actualizar el contador al iniciar
    this.carritoService.actualizarContadorCarrito();
  }

  ngOnDestroy() {
    if (this.carritoSub) {
      this.carritoSub.unsubscribe();
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
    this.router.navigate(['/client/carrito']);
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
