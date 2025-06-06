import { SafeUrl } from '@angular/platform-browser';

export interface ProfesionalResponse {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  role: string;
  direccion: string;
  telefono: string;
  foto?: string;
  fechaRegistro: string;
  imagenUrl?: SafeUrl;
}
