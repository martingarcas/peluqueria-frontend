import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CarritoResponse } from 'src/app/models/carrito/carrito-response';
import { CarritoRequest } from 'src/app/models/carrito/carrito-request';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private apiUrl = 'http://localhost:9000/api/usuarios/carrito';

  private cartItemCountSubject = new BehaviorSubject<number>(0);
  cartItemCount$ = this.cartItemCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.actualizarContadorCarrito();
  }

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
    return this.http.put<CarritoResponse>(this.apiUrl, productos, { headers: this.obtenerHeaders() })
      .pipe(
        tap(() => this.actualizarContadorCarrito())
      );
  }

  vaciarCarrito(): Observable<any> {
    return this.http.delete(this.apiUrl, { headers: this.obtenerHeaders() })
      .pipe(
        tap(() => this.actualizarContadorCarrito())
      );
  }

  finalizarPedido(): Observable<any> {
    const pedidosUrl = 'http://localhost:9000/api/pedidos';
    return this.http.post<any>(pedidosUrl, {}, { headers: this.obtenerHeaders() })
      .pipe(
        tap(() => this.actualizarContadorCarrito())
      );
  }

  actualizarContadorCarrito(): void {
    this.getCarrito().subscribe({
      next: (resp) => {
        let count = 0;
        if (resp && resp.carrito) {
          try {
            const carritoArray = JSON.parse(resp.carrito);
            count = carritoArray.reduce((acc: number, item: any) => acc + (item.cantidad || 0), 0);
          } catch (e) {
            count = 0;
          }
        }
        this.cartItemCountSubject.next(count);
      },
      error: () => {
        this.cartItemCountSubject.next(0);
      }
    });
  }
}
