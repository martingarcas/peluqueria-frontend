import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContratoService {
  private apiUrl = 'http://localhost:9000/api/contratos';

  constructor(private http: HttpClient) { }

  private obtenerHeaders(isMultipart: boolean = false): HttpHeaders {
    const storedLogin = sessionStorage.getItem('LOGIN');
    let token = '';

    if (storedLogin) {
      const loginData = JSON.parse(storedLogin);
      token = loginData.token || '';
    }

    // Para peticiones multipart, solo enviamos el token de autorización
    if (isMultipart) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }

    // Para peticiones normales, incluimos también el Content-Type
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  obtenerPorUsuarioId(usuarioId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/usuario/${usuarioId}`,
      {
        headers: this.obtenerHeaders(),
        observe: 'body',
        responseType: 'json'
      }
    );
  }

  descargarPDF(usuarioId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/usuario/${usuarioId}/pdf`,
      {
        headers: this.obtenerHeaders(),
        responseType: 'blob'
      }
    );
  }
}
