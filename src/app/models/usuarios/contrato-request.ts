export interface ContratoRequest {
    fechaInicio: string;
    fechaFin?: string;
    tipoContrato: string;
    documento?: File;
    salario: number;
}
