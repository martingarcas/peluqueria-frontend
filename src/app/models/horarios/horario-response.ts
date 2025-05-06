import { HorarioRequest } from './horario-request';

export interface HorarioResponse extends HorarioRequest {
    id: number;
    nombresTrabajadores?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}
