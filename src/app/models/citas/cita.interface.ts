/**
 * Interfaz que representa los horarios disponibles para una fecha específica
 * Utilizada en el calendario de citas para mostrar slots disponibles
 */
export interface DisponibilidadResponse {
    slots: Array<{
        hora: string;
        disponible: boolean;
    }>;
}

/**
 * Interfaz que representa los trabajadores no disponibles en una fecha/hora
 * Utilizada para filtrar trabajadores en el proceso de reserva
 */
export interface TrabajadoresResponse {
    trabajadoresNoDisponibles: number[];
}

/**
 * Interfaz que representa la lista de profesionales disponibles
 * Utilizada en la selección de trabajador para una cita
 */
export interface ProfesionalesResponse {
    trabajadores: Array<{
        id: number;
        nombre: string;
        apellidos: string;
        foto?: string;
    }>;
}
