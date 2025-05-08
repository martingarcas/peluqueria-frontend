import { ContratoRequest } from "./contrato-request";

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
