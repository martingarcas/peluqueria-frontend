/**
 * Interfaz que representa la respuesta del servidor para un servicio
 * Utilizada en componentes de listado y detalle de servicios
 */
export interface ServicioResponse {
  id: number;
  nombre: string;
  descripcion: string;
  duracion: number;
  precio: number;
  createdAt?: Date;
  updatedAt?: Date;
}
