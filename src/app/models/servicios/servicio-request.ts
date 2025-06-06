/**
 * Interfaz que representa los datos necesarios para crear o actualizar un servicio
 * Utilizada en formularios de gestión de servicios
 */
export interface ServicioRequest {
  nombre: string;
  descripcion: string;
  duracion: number;
  precio: number;
}
