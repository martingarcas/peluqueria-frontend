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

  // Obtener todos los pedidos (admin)
  obtenerTodosPedidos(): Observable<{ mensaje: string, pedidos: any[] }> {
    return this.http.get<{ mensaje: string, pedidos: any[] }>(
      `${this.apiUrl}`,
      { headers: this.obtenerHeaders() }
    );
  }

  // Actualizar el estado de un pedido (admin)
  actualizarEstadoPedido(id: number, estado: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${id}/estado`,
      { estado },
      { headers: this.obtenerHeaders() }
    );
  }
}
