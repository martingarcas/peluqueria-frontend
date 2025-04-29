import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoriaResponse } from 'src/app/models/categorias/categoria-response';
import { CategoriaRequest } from 'src/app/models/categorias/categoria-request';


@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private apiUrl = 'http://localhost:9000/api/categorias';

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

  obtenerTodas(): Observable<{ mensaje: string, categorias: CategoriaResponse[] }> {
    return this.http.get<{ mensaje: string, categorias: CategoriaResponse[] }>(this.apiUrl);
  }

  crear(categoria: CategoriaRequest): Observable<{ mensaje: string, categoria: CategoriaResponse }> {
    return this.http.post<{ mensaje: string, categoria: CategoriaResponse }>(
      this.apiUrl,
      categoria,
      { headers: this.obtenerHeaders() }
    );
  }

  actualizar(id: number, categoria: CategoriaRequest): Observable<{ mensaje: string, categoria: CategoriaResponse }> {
    return this.http.put<{ mensaje: string, categoria: CategoriaResponse }>(
      `${this.apiUrl}/${id}`,
      categoria,
      { headers: this.obtenerHeaders() }
    );
  }

  eliminar(id: number, eliminarProductos?: boolean): Observable<{ mensaje: string }> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<{ mensaje: string }>(
      url,
      {
        headers: this.obtenerHeaders(),
        params: eliminarProductos !== undefined ? { eliminarProductos } : {}
      }
    );
  }
}