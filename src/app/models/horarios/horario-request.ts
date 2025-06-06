/**
 * Interfaz que representa los datos necesarios para crear o actualizar un horario
 * Utilizada en formularios de gestión de horarios de trabajadores
 */
export interface HorarioRequest {
    nombre: string;
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
    trabajadorIds?: number[];
}
