import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioResponse } from 'src/app/models/usuarios/usuario-response';
import { UsuarioRequest } from 'src/app/models/usuarios/usuario-request';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:9000/api/usuarios';

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

  obtenerTodos(): Observable<{ mensaje: string, usuarios: UsuarioResponse[] }> {
    return this.http.get<{ mensaje: string, usuarios: UsuarioResponse[] }>(
      this.apiUrl,
      { headers: this.obtenerHeaders() }
    );
  }

  crear(usuario: UsuarioRequest): Observable<{ mensaje: string, usuario: UsuarioResponse }> {
    return this.http.post<{ mensaje: string, usuario: UsuarioResponse }>(
      this.apiUrl,
      usuario,
      { headers: this.obtenerHeaders() }
    );
  }

  actualizar(id: number, usuario: UsuarioRequest): Observable<{ mensaje: string, usuario: UsuarioResponse }> {
    return this.http.put<{ mensaje: string, usuario: UsuarioResponse }>(
      `${this.apiUrl}/${id}`,
      usuario,
      { headers: this.obtenerHeaders() }
    );
  }

  eliminar(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(
      `${this.apiUrl}/${id}`,
      { headers: this.obtenerHeaders() }
    );
  }

  // Métodos específicos para trabajadores
  asignarServicios(usuarioId: number, serviciosIds: number[]): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(
      `${this.apiUrl}/${usuarioId}/servicios`,
      { serviciosIds },
      { headers: this.obtenerHeaders() }
    );
  }

  asignarHorarios(usuarioId: number, horariosIds: number[]): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(
      `${this.apiUrl}/${usuarioId}/horarios`,
      { horariosIds },
      { headers: this.obtenerHeaders() }
    );
  }

  // Método para generar el PDF del contrato
  generarPDFContrato(usuarioId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${usuarioId}/contrato/pdf`,
      {
        headers: this.obtenerHeaders(),
        responseType: 'blob'
      }
    );
  }
}
