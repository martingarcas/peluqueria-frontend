/**
 * Interfaz que representa la respuesta del servidor para una categoría
 * Incluye la información básica de la categoría y sus productos asociados
 */
export interface CategoriaResponse {
  id: number;
  nombre: string;
  descripcion: string;
  productos: any[];
  fechaCreacion: string;
}
