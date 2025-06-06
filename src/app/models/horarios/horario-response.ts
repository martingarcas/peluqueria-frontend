import { HorarioRequest } from './horario-request';

/**
 * Interfaz que representa la respuesta del servidor para un horario
 * Extiende HorarioRequest añadiendo ID y nombres de trabajadores asignados
 */
export interface HorarioResponse extends HorarioRequest {
    id: number;
    nombresTrabajadores?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}
