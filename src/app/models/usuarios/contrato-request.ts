/**
 * Interfaz que representa los datos necesarios para crear o actualizar un contrato
 * Utilizada en formularios de gestión de contratos de trabajadores
 */
export interface ContratoRequest {
    fechaInicio: string;
    fechaFin?: string;
    tipoContrato: string;
    documento?: File;
    salario: number;
}
