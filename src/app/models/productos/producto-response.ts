/**
 * Interfaz para la respuesta de productos del backend
 * Se utiliza en los componentes de lista y detalles de productos
 * Incluye información completa del producto y su categoría
 */
import { SafeUrl } from '@angular/platform-browser';

export interface ProductoResponse {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoriaId?: number;
  categoriaNombre?: string;
  foto?: string;
  fechaCreacion: string;
  imagenUrl?: SafeUrl;
}
