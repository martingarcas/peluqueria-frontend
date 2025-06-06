/**
 * Interfaz para crear o actualizar un producto
 * Se utiliza en el formulario de productos del admin
 * Incluye información básica y categoría del producto
 */
export interface ProductoRequest {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoriaId: number;
  foto?: File;  // Archivo de imagen opcional
}
