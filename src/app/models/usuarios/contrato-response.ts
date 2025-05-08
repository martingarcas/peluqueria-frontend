export interface ContratoResponse {
    id: number;
    fechaInicio: string;
    fechaFin?: string;
    tipoContrato: string;
    estado: string;
    urlContrato: string;
}
