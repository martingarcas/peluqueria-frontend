import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ClienteGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const loginData = JSON.parse(sessionStorage.getItem('LOGIN') || '{}');
    const role = loginData.user?.role?.toLowerCase();

    if (role === 'cliente') {
      return true;
    }

    // Si no es cliente, lo llevamos a la home pública
    this.router.navigate(['/']);
    return false;
  }
}
