export interface HorarioRequest {
    nombre: string;
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
    trabajadorIds?: number[];
}
