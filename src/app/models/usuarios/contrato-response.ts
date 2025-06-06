/**
 * Interfaz que representa la respuesta del servidor para un contrato de trabajador
 * Utilizada en componentes de detalle de trabajador y gestión de contratos
 */
export interface ContratoResponse {
    id: number;
    usuarioId: number;
    nombreUsuario: string;
    fechaInicioContrato: string;
    fechaFinContrato?: string;
    tipoContrato: string;
    estadoId: number;
    estadoNombre: string;
    urlContrato: string;
    salario: number;
}
