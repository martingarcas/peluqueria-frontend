import { ContratoResponse } from './contrato-response';
import { SafeUrl } from '@angular/platform-browser';

/**
 * Interfaz que representa la respuesta del servidor para un usuario
 * Utilizada en componentes de listado y detalle de usuarios
 */
export interface UsuarioResponse {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  role: string;
  foto?: string;
  imagenUrl?: SafeUrl;
  fechaRegistro: string;
  expanded?: boolean;
  // Campos específicos para trabajadores
  contrato?: ContratoResponse;
  servicios?: { id: number; nombre: string }[];
  horarios?: { id: number; dia: string; horaInicio: string; horaFin: string }[];
}

