/**
 * Interfaz que representa la respuesta del servidor para una cita
 * Incluye información detallada de la cita, servicio, trabajador y cliente
 */
export interface CitaResponse {
    id: number;
    servicioId: number;
    servicioNombre: string;
    trabajadorId: number;
    trabajadorNombre: string;
    usuarioId: number;
    usuarioNombre: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    estado: string;
}
