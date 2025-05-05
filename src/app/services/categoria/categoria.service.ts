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

  obtenerTodas(): Observable<{ mensaje: string, categorias: CategoriaResponse[] }> {
    return this.http.get<{ mensaje: string, categorias: CategoriaResponse[] }>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<{ mensaje: string, categoria: CategoriaResponse }> {
    return this.http.get<{ mensaje: string, categoria: CategoriaResponse }>(
      `${this.apiUrl}/${id}`,
      { headers: this.obtenerHeaders() }
    );
  }

  crear(categoria: CategoriaRequest, productosNuevos?: any[], productosExistentesIds?: number[],
        forzarMovimiento?: boolean, fotos?: File[]): Observable<{ mensaje: string, categoria: CategoriaResponse }> {
    const formData = new FormData();

    // Agregar la categoría como JSON
    formData.append('categoria', new Blob([JSON.stringify({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion
    })], {
      type: 'application/json'
    }));

    // Agregar productos nuevos si existen
    if (productosNuevos && productosNuevos.length > 0) {
      formData.append('productosNuevos', new Blob([JSON.stringify(productosNuevos)], {
        type: 'application/json'
      }));
    }

    // Agregar IDs de productos existentes si existen
    if (productosExistentesIds && productosExistentesIds.length > 0) {
      formData.append('productosExistentesIds', new Blob([JSON.stringify(productosExistentesIds)], {
        type: 'application/json'
      }));
    }

    // Agregar forzarMovimiento si está definido
    if (forzarMovimiento !== undefined) {
      formData.append('forzarMovimiento', forzarMovimiento.toString());
    }

    // Agregar fotos si existen
    if (fotos && fotos.length > 0) {
      fotos.forEach(foto => {
        formData.append('fotos', foto);
      });
    }

    return this.http.post<{ mensaje: string, categoria: CategoriaResponse }>(
      this.apiUrl,
      formData,
      { headers: this.obtenerHeaders(true) }
    );
  }

  actualizar(id: number, categoria: CategoriaRequest, productosNuevos?: any[], productosExistentesIds?: number[],
             forzarMovimiento?: boolean, fotos?: File[]): Observable<{ mensaje: string, categoria: CategoriaResponse }> {
    const formData = new FormData();

    // Agregar la categoría como JSON
    formData.append('categoria', new Blob([JSON.stringify({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion
    })], {
      type: 'application/json'
    }));

    // Agregar productos nuevos si existen
    if (productosNuevos && productosNuevos.length > 0) {
      formData.append('productosNuevos', new Blob([JSON.stringify(productosNuevos)], {
        type: 'application/json'
      }));
    }

    // Agregar IDs de productos existentes si existen
    if (productosExistentesIds && productosExistentesIds.length > 0) {
      formData.append('productosExistentesIds', new Blob([JSON.stringify(productosExistentesIds)], {
        type: 'application/json'
      }));
    }

    // Agregar forzarMovimiento si está definido
    if (forzarMovimiento !== undefined) {
      formData.append('forzarMovimiento', forzarMovimiento.toString());
    }

    // Agregar fotos si existen
    if (fotos && fotos.length > 0) {
      fotos.forEach(foto => {
        formData.append('fotos', foto);
      });
    }

    return this.http.put<{ mensaje: string, categoria: CategoriaResponse }>(
      `${this.apiUrl}/${id}`,
      formData,
      { headers: this.obtenerHeaders(true) }
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
