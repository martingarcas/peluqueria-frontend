import { ProductoRequest } from '../productos/producto-request';

/**
 * Interfaz para crear o actualizar una categoría
 * Se utiliza en el formulario de categorías del admin
 * Permite añadir productos nuevos y mover existentes
 */
export interface CategoriaRequest {
  nombre: string;
  descripcion: string;
  productosNuevos?: ProductoRequest[];        // Productos nuevos a crear
  productosExistentesIds?: number[];         // IDs de productos existentes a mover
  forzarMovimiento?: boolean;                // Forzar el movimiento de productos
}
