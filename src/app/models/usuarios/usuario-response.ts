export interface UsuarioResponse {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  role: string;
  foto?: string;
  // Campos específicos para trabajadores
  contrato?: ContratoResponse;
  servicios?: { id: number; nombre: string }[];
  horarios?: { id: number; dia: string; horaInicio: string; horaFin: string }[];
}

export interface ContratoResponse {
  id: number;
  fechaInicio: string;
  fechaFin?: string;
  tipoContrato: string;
  estado: string;
  salario: number;
  urlContrato: string;
}

export interface ServicioResponse {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion: string;
}

export interface HorarioResponse {
  id: number;
  dia: string;
  horaInicio: string;
  horaFin: string;
}
