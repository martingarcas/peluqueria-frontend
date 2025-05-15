export interface CitaRequest {
    servicioId: number;
    trabajadorId: number;
    fecha: string;
    horaInicio: string;
}

export interface ReasignacionRequest {
    trabajadorId: number;
    fecha: string;
    horaInicio: string;
}

export interface CitasRequest {
    citas: CitaRequest[];
}
