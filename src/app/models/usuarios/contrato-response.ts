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
