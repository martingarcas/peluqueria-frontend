export interface UsuarioRequest {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  telefono: string;
  rol: string;
  foto?: File;
  // Campos opcionales para trabajadores
  contrato?: ContratoRequest;
  serviciosIds?: number[];
  horariosIds?: number[];
}

export interface ContratoRequest {
  fechaInicio: string;
  fechaFin?: string;
  tipoContrato: string;
  usuario_id?: number; // Se asigna automáticamente en el backend
  documento?: File;
}
