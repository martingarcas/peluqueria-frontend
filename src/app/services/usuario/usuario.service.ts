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

  obtenerTodos(): Observable<{ mensaje: string, usuarios: UsuarioResponse[] }> {
    return this.http.get<{ mensaje: string, usuarios: UsuarioResponse[] }>(
      this.apiUrl,
      { headers: this.obtenerHeaders() }
    );
  }

  crear(usuario: UsuarioRequest): Observable<{ mensaje: string, usuario: UsuarioResponse }> {
    if (usuario.role === 'trabajador') {
      return this.crearTrabajador(usuario);
    }

    const formData = new FormData();

    // Crear un Blob con el JSON del usuario
    const usuarioBlob = new Blob([JSON.stringify({
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      email: usuario.email,
      password: usuario.password,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      role: usuario.role
    })], {
      type: 'application/json'
    });

    formData.append('usuario', usuarioBlob);

    if (usuario.foto) {
      formData.append('foto', usuario.foto);
    }

    return this.http.post<{ mensaje: string, usuario: UsuarioResponse }>(
      this.apiUrl,
      formData,
      { headers: this.obtenerHeaders(true) }
    );
  }

  private crearTrabajador(usuario: UsuarioRequest): Observable<{ mensaje: string, usuario: UsuarioResponse }> {
    const formData = new FormData();

    // Datos básicos del usuario
    const usuarioBlob = new Blob([JSON.stringify({
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      email: usuario.email,
      password: usuario.password,
      telefono: usuario.telefono,
      direccion: usuario.direccion || '',
      role: 'trabajador',
      serviciosIds: usuario.serviciosIds,
      horariosIds: usuario.horariosIds
    })], {
      type: 'application/json'
    });

    formData.append('usuario', usuarioBlob);

    // Foto del usuario
    if (usuario.foto) {
      formData.append('foto', usuario.foto);
    }

    // Documento del contrato
    if (usuario.contrato && usuario.contrato.documento) {
      formData.append('documentoContrato', usuario.contrato.documento);
    }

    // Parámetros del contrato
    if (usuario.contrato) {
      formData.append('fechaInicioContrato', usuario.contrato.fechaInicio);
      if (usuario.contrato.fechaFin) {
        formData.append('fechaFinContrato', usuario.contrato.fechaFin);
      }
      formData.append('tipoContrato', usuario.contrato.tipoContrato);
      formData.append('salario', usuario.contrato.salario.toString());
    }

    return this.http.post<{ mensaje: string, usuario: UsuarioResponse }>(
      `${this.apiUrl}/trabajador`,
      formData,
      { headers: this.obtenerHeaders(true) }
    );
  }

  actualizar(id: number, usuario: UsuarioRequest): Observable<{ mensaje: string, usuario: UsuarioResponse }> {
    const formData = new FormData();

    // Crear Blob con los datos del usuario
    const usuarioBlob = new Blob([JSON.stringify({
      id: id,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      email: usuario.email,
      password: usuario.password,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      role: usuario.role
    })], {
      type: 'application/json'
    });

    formData.append('usuario', usuarioBlob);

    // Agregar foto si se proporciona
    if (usuario.foto) {
      formData.append('foto', usuario.foto);
    }

    // En este método ya no permitimos actualizar a rol trabajador
    // ni agregar documentos de contrato

    return this.http.patch<{ mensaje: string, usuario: UsuarioResponse }>(
      `${this.apiUrl}/${id}`,
      formData,
      { headers: this.obtenerHeaders(true) }
    );
  }

  eliminar(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(
      `${this.apiUrl}/${id}`,
      { headers: this.obtenerHeaders() }
    );
  }

  // Métodos para manejo de imágenes
  obtenerImagen(rutaImagen: string): Observable<Blob> {
    return this.http.get(`http://localhost:9000${rutaImagen}`, {
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
}
