export interface ServicioResponse {
  id: number;
  nombre: string;
  descripcion: string;
  duracion: number;
  precio: number;
  createdAt?: Date;
  updatedAt?: Date;
}
