import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const loginData = sessionStorage.getItem('LOGIN');

    if (!loginData) {
      // Usuario no está logueado, redirigir a la home pública
      this.router.navigate(['/']);
      return false;
    }

    // Usuario está logueado, verificar rol y redirigir si es necesario
    const userData = JSON.parse(loginData);
    const role = userData.user?.role?.toLowerCase();

    // Si intenta acceder a una ruta que no corresponde con su rol
    if (state.url.includes('/client') && role !== 'cliente' ||
        state.url.includes('/admin') && role !== 'admin' ||
        state.url.includes('/worker') && role !== 'trabajador') {

      // Redirigir según el rol
      switch(role) {
        case 'admin':
          this.router.navigate(['/admin']);
          break;
        case 'trabajador':
          this.router.navigate(['/worker']);
          break;
        case 'cliente':
          this.router.navigate(['/client']);
          break;
        default:
          this.router.navigate(['/']);
      }
      return false;
    }

    return true;
  }
}
