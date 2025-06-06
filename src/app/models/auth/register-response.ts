/**
 * Interfaz que representa la respuesta del servidor después de registrar un usuario
 * Incluye los datos del usuario creado y un mensaje de confirmación
 */
export interface RegisterResponse {
    data: {
        id: number;           // ID del usuario creado
        nombre: string;       // Nombre del usuario
        apellidos: string;    // Apellidos del usuario
        email: string;        // Email del usuario
        role: string;        // Role asignado (por defecto será 'cliente')
        telefono: string;    // Teléfono del usuario
        direccion?: string;  // Dirección del usuario (opcional)
    };
    mensaje: string;        // Mensaje de éxito o error
}
