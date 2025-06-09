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

  obtenerTodos(): Observable<{ mensaje: string, usuarios: UsuarioResponse[] }> {
    return this.http.get<{ mensaje: string, usuarios: UsuarioResponse[] }>(
      this.apiUrl,
      {
        headers: this.obtenerHeaders(),
        observe: 'body',
        responseType: 'json'
      }
    );
  }

  crear(usuario: FormData): Observable<{ mensaje: string, usuario: UsuarioResponse }> {
    return this.http.post<{ mensaje: string, usuario: UsuarioResponse }>(
      this.apiUrl,
      usuario,
      {
        headers: this.obtenerHeaders(true),
        observe: 'body',
        responseType: 'json'
      }
    );
  }

  actualizar(id: number, usuario: FormData): Observable<{ mensaje: string, usuario: UsuarioResponse }> {
    // Log para depuración
    const formDataObj: any = {};
    usuario.forEach((value, key) => {
      formDataObj[key] = value;
    });
    console.log('Datos enviados al backend:', {
      id: id,
      formData: formDataObj
    });

    return this.http.put<{ mensaje: string, usuario: UsuarioResponse }>(
      `${this.apiUrl}/${id}`,
      usuario,
      {
        headers: this.obtenerHeaders(true),
        observe: 'body',
        responseType: 'json'
      }
    );
  }

  eliminar(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(
      `${this.apiUrl}/${id}`,
      {
        headers: this.obtenerHeaders(),
        observe: 'body',
        responseType: 'json'
      }
    );
  }

  // Métodos para manejo de imágenes
  obtenerImagen(rutaImagen: string): Observable<Blob> {
    const url = rutaImagen.startsWith('http') ? rutaImagen : `http://localhost:9000${rutaImagen}`;
    return this.http.get(url, {
      headers: this.obtenerHeaders(),
      responseType: 'blob'
    });
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

  obtenerTrabajadores(): Observable<{ mensaje: string, usuarios: UsuarioResponse[] }> {
    return this.http.get<{ mensaje: string, usuarios: UsuarioResponse[] }>(
      `${this.apiUrl}/trabajadores`,
      {
        headers: this.obtenerHeaders(),
        observe: 'body',
        responseType: 'json'
      }
    );
  }

  obtenerClientes(): Observable<{ mensaje: string, usuarios: UsuarioResponse[] }> {
    return this.http.get<{ mensaje: string, usuarios: UsuarioResponse[] }>(
      `${this.apiUrl}/clientes`,
      {
        headers: this.obtenerHeaders(),
        observe: 'body',
        responseType: 'json'
      }
    );
  }

  obtenerPorId(id: number): Observable<{ mensaje: string, usuario: UsuarioResponse }> {
    return this.http.get<{ mensaje: string, usuario: UsuarioResponse }>(
      `${this.apiUrl}/${id}`,
      {
        headers: this.obtenerHeaders(),
        observe: 'body',
        responseType: 'json'
      }
    );
  }
}
