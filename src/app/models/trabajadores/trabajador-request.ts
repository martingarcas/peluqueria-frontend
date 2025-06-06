/**
 * Interfaz para crear o actualizar un trabajador
 * Se utiliza en el formulario de trabajadores del admin
 * Incluye información personal y profesional
 */
export interface TrabajadorRequest {
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
    especialidad: string;
    foto?: File;  // Archivo de imagen opcional
} 