import { ContratoRequest } from "./contrato-request";

/**
 * Interfaz que representa los datos necesarios para crear o actualizar un usuario
 * Utilizada en formularios de registro y edición de usuarios
 */
export interface UsuarioRequest {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  telefono: string;
  direccion?: string;
  role: string;
  foto?: File;
  // Campos opcionales para trabajadores
  contrato?: ContratoRequest;
  serviciosIds?: number[];
  horariosIds?: number[];
}
