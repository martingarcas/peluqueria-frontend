// src/app/services/producto/producto.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductoResponse } from 'src/app/models/productos/producto-response';
import { ProductoRequest } from 'src/app/models/productos/producto-request';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = 'http://localhost:9000/api/productos';

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

  obtenerTodos(): Observable<{ mensaje: string, productos: ProductoResponse[] }> {
    return this.http.get<{ mensaje: string, productos: ProductoResponse[] }>(this.apiUrl);
  }

  crear(producto: ProductoRequest): Observable<{ mensaje: string, producto: ProductoResponse }> {
    const formData = new FormData();

    // Crear un Blob con el JSON del producto
    const productoBlob = new Blob([JSON.stringify({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      stock: producto.stock,
      categoriaId: producto.categoriaId
    })], {
      type: 'application/json'
    });

    formData.append('producto', productoBlob);

    if (producto.foto) {
      formData.append('foto', producto.foto);
    }

    return this.http.post<{ mensaje: string, producto: ProductoResponse }>(
      this.apiUrl,
      formData,
      { headers: this.obtenerHeaders(true) }
    );
  }

  actualizar(id: number, producto: ProductoRequest): Observable<{ mensaje: string, producto: ProductoResponse }> {
    const formData = new FormData();

    // Crear un Blob con el JSON del producto
    const productoBlob = new Blob([JSON.stringify({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      stock: producto.stock,
      categoriaId: producto.categoriaId
    })], {
      type: 'application/json'
    });

    formData.append('producto', productoBlob);

    if (producto.foto) {
      formData.append('foto', producto.foto);
    }

    return this.http.put<{ mensaje: string, producto: ProductoResponse }>(
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

  obtenerImagen(rutaImagen: string): Observable<Blob> {
    return this.http.get(`http://localhost:9000${rutaImagen}`, {
      headers: this.obtenerHeaders(),
      responseType: 'blob'
    });
  }

  obtenerPorId(id: number): Observable<{ mensaje: string, producto: ProductoResponse }> {
    return this.http.get<{ mensaje: string, producto: ProductoResponse }>(
      `${this.apiUrl}/${id}`,
      { headers: this.obtenerHeaders() }
    );
  }
}
