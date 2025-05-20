import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CarritoResponse } from 'src/app/models/carrito/carrito-response';
import { CarritoRequest } from 'src/app/models/carrito/carrito-request';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private apiUrl = 'http://localhost:9000/api/usuarios/carrito';

  constructor(private http: HttpClient) { }

  private obtenerHeaders(): HttpHeaders {
    const storedLogin = sessionStorage.getItem('LOGIN');
    let token = '';
    if (storedLogin) {
      const loginData = JSON.parse(storedLogin);
      token = loginData.token || '';
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getCarrito(): Observable<CarritoResponse> {
    return this.http.get<CarritoResponse>(this.apiUrl, { headers: this.obtenerHeaders() });
  }

  updateCarrito(productos: CarritoRequest[]): Observable<CarritoResponse> {
    return this.http.put<CarritoResponse>(this.apiUrl, productos, { headers: this.obtenerHeaders() });
  }

  vaciarCarrito(): Observable<any> {
    return this.http.delete(this.apiUrl, { headers: this.obtenerHeaders() });
  }
}
