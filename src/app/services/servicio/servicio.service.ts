import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServicioResponse } from '../../models/servicios/servicio-response';
import { ServicioRequest } from '../../models/servicios/servicio-request';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServicioService {
  private apiUrl = 'http://localhost:9000/api/servicios';

  constructor(private http: HttpClient) { }

  private obtenerHeaders(isMultipart: boolean = false): HttpHeaders {
    const storedLogin = sessionStorage.getItem('LOGIN');
    let token = '';

    if (storedLogin) {
      const loginData = JSON.parse(storedLogin);
      token = loginData.token || '';
    }

    if (isMultipart) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  obtenerTodos(): Observable<{ mensaje: string, servicios: ServicioResponse[] }> {
    return this.http.get<{ mensaje: string, servicios: ServicioResponse[] }>(
      this.apiUrl,
      { headers: this.obtenerHeaders() }
    );
  }

  obtenerPorId(id: number): Observable<{ mensaje: string, servicio: ServicioResponse }> {
    return this.http.get<{ mensaje: string, servicio: ServicioResponse }>(
      `${this.apiUrl}/${id}`,
      { headers: this.obtenerHeaders() }
    );
  }

  crear(servicio: ServicioRequest): Observable<{ mensaje: string, servicio: ServicioResponse }> {
    return this.http.post<{ mensaje: string, servicio: ServicioResponse }>(
      this.apiUrl,
      servicio,
      { headers: this.obtenerHeaders() }
    );
  }

  actualizar(id: number, servicio: ServicioRequest): Observable<{ mensaje: string, servicio: ServicioResponse }> {
    return this.http.put<{ mensaje: string, servicio: ServicioResponse }>(
      `${this.apiUrl}/${id}`,
      servicio,
      { headers: this.obtenerHeaders() }
    );
  }

  eliminar(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(
      `${this.apiUrl}/${id}`,
      { headers: this.obtenerHeaders() }
    );
  }
}
