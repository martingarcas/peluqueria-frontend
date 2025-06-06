/**
 * Interfaz para la respuesta de trabajadores del backend
 * Se utiliza en los componentes de lista y detalles de trabajadores
 * Incluye información completa del trabajador
 */
export interface TrabajadorResponse {
    id: number;
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
    especialidad: string;
    foto?: string;
    fechaCreacion: string;
} 