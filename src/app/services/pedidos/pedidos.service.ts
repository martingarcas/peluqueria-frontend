import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = 'http://localhost:9000/api/pedidos';

  constructor(private http: HttpClient) {}

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

  // Obtener los pedidos del usuario autenticado
  obtenerMisPedidos(): Observable<{ mensaje: string, pedidos: any[] }> {
    return this.http.get<{ mensaje: string, pedidos: any[] }>(
      `${this.apiUrl}/mis-pedidos`,
      { headers: this.obtenerHeaders() }
    );
  }

  // (Opcional) Obtener un pedido por id
  obtenerPorId(id: number): Observable<{ mensaje: string, pedido: any }> {
    return this.http.get<{ mensaje: string, pedido: any }>(
      `${this.apiUrl}/${id}`,
      { headers: this.obtenerHeaders() }
    );
  }
}