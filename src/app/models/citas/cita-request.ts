/**
 * Interfaz para crear una nueva cita
 * Se utiliza en el formulario de reserva de citas
 */
export interface CitaRequest {
    servicioId: number;
    trabajadorId: number;
    fecha: string;
    horaInicio: string;
}

/**
 * Interfaz para reasignar una cita existente
 * Solo disponible para administradores
 * Pendiente de implementar en la UI
 */
export interface ReasignacionRequest {
    trabajadorId: number;
    fecha: string;
    horaInicio: string;
}

/**
 * Interfaz para crear múltiples citas a la vez
 * Se utiliza en el formulario de reserva de citas
 */
export interface CitasRequest {
    citas: CitaRequest[];
}
